import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Logger,
  NotFoundException,
  ParseIntPipe,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { BlockService } from 'src/block/block.service';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { SocketTransformInterceptor } from 'src/common/interceptors/socket-tranform.interceptor';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { FriendService } from 'src/friend/friend.service';
import { UserEntity, UserState } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Server } from 'ws';
import { CreateChannelUserDto } from './channel-user.dto';
import { ChannelUserEntity } from './channel-user.entity';
import {
  CreateChannelDto,
  MessageDto,
  UpdateChannelDto,
  UpdateChannelUserDto,
} from './channel.dto';
import { ChannelService } from './channel.service';

@WebSocketGateway({ namespace: 'channel' })
@UseFilters(AllExceptionsSocketFilter)
//@UseInterceptors(SocketTransformInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChannelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private userService: UserService,
    private blockService: BlockService,
    private friendService: FriendService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @WebSocketServer()
  server: Server;
  private logger = new Logger('ChannelGateway');

  async afterInit(server: Server) {
    const alluser: UserEntity[] = await this.userService.getAllUser();
    for (const user of alluser) {
      await this.userService.updateUserElements(user.id, { socketId: null });
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || !client.id || user.socketId) {
      return client.disconnect();
    }
    this.logger.log(`Client connected: ${user.nickname}`);
    await this.userService.updateUserElements(user.id, {
      socketId: client.id,
      userState: UserState.ONCHAT,
    });
    user.channels.forEach((channel) => {
      client.join(channel.id.toString());
    });
    const toFriendList = await this.friendService.getFriendListByToId(user.id);
    for (const toFriendFrom of toFriendList) {
      const toFriend = await this.userService.getUserById(toFriendFrom.from);
      if (!toFriend.socketId) continue;
      this.server.to(toFriend.socketId).emit('changeFriendState', {
        friendId: user.id,
        userState: UserState.ONLINE,
      });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || client.id !== user.socketId) return;
    this.logger.log(`Client distconnected: ${user.nickname}`);
    await this.userService.updateUserElements(user.id, {
      socketId: null,
      userState: UserState.OFFLINE,
    });
    for (const friend of user.friends) {
      const friendSocketId = await this.userService.getUserById(friend.id);
      if (!friendSocketId?.socketId) continue;
      this.server.to(friendSocketId.socketId).emit('changeFriendState', {
        friendId: user.id,
        userState: UserState.OFFLINE,
      });
    }
    client.rooms.clear();
  }

  @SubscribeMessage('joinChannel')
  async joinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelUserDto: CreateChannelUserDto,
  ) {
    try {
      const user = await this.authService.getUserFromSocket(client);
      if (!user) client.disconnect();
      const { userId, channelId } = createChannelUserDto;
      this.verifyRequestIdMatch(user.id, userId);
      const result = await this.channelService.joinChannelUser(
        createChannelUserDto,
      );
      if (!result) throw new WsException('Channel not found');
      client.join(channelId.toString());
      client.to(channelId.toString()).emit('channelMessage', {
        message: `${user.nickname}님이 입장하셨습니다.`,
      });
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageDto: MessageDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new NotFoundException({ error: ' User not found' });
    const { userId, channelId, message } = messageDto;
    if (!userId && channelId)
      this.emitToChannel(user, channelId, 'channelMessage', {
        channelId,
        userId: user.id,
        nickname: user.nickname,
        message,
      }).catch((err) => {});
    else if (userId && !channelId)
      this.emitToUser(user, userId, 'userMessage', {
        userId: user.id,
        nickname: user.nickname,
        message,
      }).catch((err) => {});
    else throw new NotFoundException({ error: 'User or Channel not found' });
  }

  @SubscribeMessage('visibleChannel')
  async getVisibleChannel(@ConnectedSocket() client: Socket) {
    const channels = await this.channelService.getVisibleChannel();
    this.server.to(client.id).emit('visibleChannel', channels);
    return channels;
  }

  @SubscribeMessage('kickChannelUser')
  async kickChannelUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelUserInfo: UpdateChannelUserDto,
  ) {
    try {
      const user = await this.authService.getUserFromSocket(client);
      const { userId, channelId } = channelUserInfo;
      if (!user) throw new NotFoundException({ error: ' User not found' });
      this.verifyNotSelfBanOrKick(user.id, userId);
      const targetUser = await this.userService.getUserById(
        channelUserInfo.userId,
      );
      if (!targetUser) throw new NotFoundException({ error: 'User not found' });
      await this.channelService.kickChannelUser(user.id, channelUserInfo);
      if (targetUser.socketId) {
        const targetUserSocket: Socket = this.server.sockets.get(
          targetUser.socketId,
        );
        targetUserSocket.to(channelId.toString()).emit('channelMessage', {
          message: `${targetUser.nickname}님이 강퇴당하셨습니다.`,
        });
        targetUserSocket.rooms.delete(channelUserInfo.channelId.toString());
      }
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('updateChannelUser')
  async updateBanChannelUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelUserInfo: UpdateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('ban Error'); //this.server.to(client.id).emit('ban', { message: 'you are banned' });
    try {
      this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
      return await this.channelService.banChannelUser(user.id, channelUserInfo);
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('admin')
  async setAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelUserInfo: UpdateChannelUserDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (user.id === channelUserInfo.userId)
      throw new WsException(`You can't set yourself as admin`);
    try {
      return await this.channelService.setAdmin(user.id, channelUserInfo);
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('password')
  async updatePassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelInfo: UpdateChannelDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('password Error');
    try {
      return await this.channelService.updatePassword(user.id, channelInfo);
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('createChannel')
  async createChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody('channelInfo', ChannelTypePipe)
    channelInfo: CreateChannelDto,
    @MessageBody('channelUserIds', NumArrayPipe)
    channelUserIds: number[],
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('create Error');
    try {
      this.verifyRequestIdMatch(user.id, channelInfo.ownerId);
      const result = await this.channelService.createChannel(
        channelInfo,
        channelUserIds,
      );
      if (!result) throw new WsException('create Error');
      const channelUsers = await this.channelService.getChannelUser(result.id);
      for (const channelUser of channelUsers) {
        const user = await this.userService.getUserById(channelUser.userId);
        const userSocket = this.server.sockets.get(user.socketId);
        if (!userSocket) continue;
        userSocket.join(result.id.toString());
      }
      return result;
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('leaveChannel')
  async leaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('leave Error');
    await this.channelService.leaveChannel(user.id, channelId);
    client.to(channelId.toString()).emit('channelMessage', {
      message: `${user.nickname}님이 나가셨습니다.`,
    });
    client.rooms.delete(channelId.toString());
  }

  async emitToUser(
    user: any,
    targetUserId: number,
    event: string,
    ...data: any
  ) {
    const targetUser = await this.userService.getUserById(targetUserId);
    let isBlocked = false;
    targetUser.blocks.forEach((block) => {
      if (block.id === user.id) {
        isBlocked = true;
        return;
      }
    });
    if (isBlocked) return;
    const userSocket = this.server.sockets.get(user.socketId);
    if (!targetUser || !targetUser.socketId || !userSocket) return;
    this.server.to(targetUser.socketId).emit(event, data);
    //this.cacheMessages(data);
  }

  async emitToChannel(
    user: UserEntity,
    channelId: number,
    event: string,
    ...data: any
  ) {
    const userChannel = await this.channelService.getChannelUserByIds(
      channelId,
      user.id,
    );
    if (!(await this.channelService.getChannelUserByIds(channelId, user.id)))
      throw new WsException({ error: 'You are not in this channel' });
    if (!userChannel)
      throw new WsException({ error: 'You are not in this channel' });
    // 만약에 안쓸거면 controller 를 사용하지 않으면 상관없음
    const channelUsers = await this.channelService.getChannelUser(channelId);
    for (const channelUser of channelUsers) {
      const user = await this.userService.getUserById(channelUser.userId);
      const userSocket = this.server.sockets.get(user.socketId);
      if (!userSocket) continue;
      userSocket.join(channelId.toString());
    }
    // 여기까지
    const userSocket = this.server.sockets.get(user.socketId);
    if (!userSocket) return;
    if (await this.channelService.getChannelUserByIds(channelId, user.id)) {
      userSocket.to(channelId.toString()).emit(event, data);
      //this.cacheMessages(data);
    }
  }
  /*
  private async cacheMessages(data: any): Promise<void> {
    this.cacheManager.store.lpush(`cachedMessages`, JSON.stringify(data));
    const cachedMessages = await this.cacheManager.store
      .getClient()
      .lrange('cachedMessages', 0, -1);
    if (cachedMessages.length >= 100) {
      await this.flushCachedMessages(cachedMessages);
    }
  }

  private async flushCachedMessages(messages: string[]): Promise<void> {
    const entities = messages.map((message) => {
      const data = JSON.parse(message);
      const messageData: MessageEntity = {
        fromId: data.fromId,
        toChannelId: data.channelId,
        message: data.message,
        toUserId: data.toUserId,
        fromNickname: data.fromNickname,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
      return this.messageRepository.create(messageData);
    });
    await this.messageRepository.save(entities);
    // Redis에서 캐싱된 메시지들을 삭제
    await this.cacheManager.del('cachedMessages');
  }
  */
  verifyRequestIdMatch(userId: number, requestBodyUserId: number) {
    if (userId !== requestBodyUserId)
      throw new WsException(`Id in request body doesn't match with your id`);
  }

  verifyNotSelfBanOrKick(fromUserId: number, toUserId: number) {
    if (fromUserId === toUserId)
      throw new WsException(`You can't ban or kick yourself`);
  }

  // Block
  @SubscribeMessage('getBlockList')
  async getBlockList(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    const blockIds = await this.blockService.getBlockListByFromId(userId);
    const blockList = [];
    for (const id of blockIds) {
      blockList.push(
        await this.userService.getUserElementsById(id.to, [
          'id',
          'nickname',
          'avatar',
        ]),
      );
    }
    this.server.to(client.id).emit('getBlockList', blockList);
    return { sucess: true, blockList };
  }

  @SubscribeMessage('createBlock')
  async createBlockList(
    @ConnectedSocket() client: Socket,
    @MessageBody('blockUserId', ParseIntPipe, PositiveIntPipe)
    blockUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === blockUserId)
      throw new WsException(`Can't be block with yourself`);
    const createBlock = await this.blockService
      .createBlock({
        from: userId,
        to: blockUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
    this.server.to(client.id).emit('createBlock', createBlock);
    return { sucess: true, createBlock };
  }

  @SubscribeMessage('deleteBlock')
  async deleteFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('blockedUserId', ParseIntPipe, PositiveIntPipe)
    blockedUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === blockedUserId)
      throw new WsException(`Can't be block with yourself`);
    const deleteBlock = await this.blockService
      .deleteBlock({
        from: userId,
        to: blockedUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
    this.server.to.client.id.emit('deleteBlock', deleteBlock);
    return { sucess: true, deleteBlock };
  }

  // Friend

  @SubscribeMessage('getFriendList')
  async getFriendList(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    const friendIds = await this.friendService.getFriendListByFromId(userId);
    const friendList = [];
    for (const id of friendIds) {
      friendList.push(
        await this.userService.getUserElementsById(id.to, [
          'id',
          'nickname',
          'avatar',
          'userState',
        ]),
      );
    }
    this.server.to(client.id).emit('getFriendList', friendList);
    //return friendList;
  }

  @SubscribeMessage('createFriend')
  async createFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === followingUserId)
      throw new WsException(`Can't be friend with yourself`);
    const friend = await this.friendService
      .creatFriend({
        from: userId,
        to: followingUserId,
      })
      .catch((err) => {
        this.logger.log(err);
        throw new WsException(err);
      });
    this.server.to(client.id).emit('createFriend', friend);
    return { success: true, friend };
  }

  @SubscribeMessage('deleteFriend')
  async deleteFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === followingUserId)
      throw new WsException(`Can't remove yourself from your friend list`);
    await this.friendService
      .deleteFriend({
        from: userId,
        to: followingUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
  }

  @SubscribeMessage('getChannelAdmin')
  async getChannelAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId', ParseIntPipe, PositiveIntPipe)
    channelId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const channel = await this.channelService.getChannelByChannelId(channelId);
    if (!channel) throw new WsException('Channel not found');
    const channelAdmin = await this.channelService.getChannelAdminId(channelId);
    return channelAdmin;
  }

  @SubscribeMessage('inviteUser')
  async inviteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelUserDto: CreateChannelUserDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const { userId } = createChannelUserDto;
    const ret = await this.channelService.inviteUserToChannel(
      user.id,
      createChannelUserDto,
    );
    const targetUser = await this.userService.getUserById(userId);
    if (targetUser.socketId) {
      const targetSocket: Socket = this.server.sockets.get(targetUser.socketId);
      targetSocket.join(ret.channelId.toString());
      targetSocket.to(ret.channelId.toString()).emit('channelMessage', {
        message: `${user.nickname} has invited ${targetUser.nickname} to join this channel`,
      });
    }
    return ret;
  }

  @SubscribeMessage('allUser')
  async getAllUser(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    return await this.userService.getAllUser();
  }
}
