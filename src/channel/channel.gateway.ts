import {
  Logger,
  NotFoundException,
  ParseIntPipe,
  UseFilters,
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
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { BlockService } from 'src/block/block.service';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { FriendDto } from 'src/friend/friend.dto';
import { FriendEntity } from 'src/friend/friend.entity';
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
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelService } from './channel.service';
import { BlockEntity } from 'src/block/block.entity';

@WebSocketGateway({ namespace: 'channel' })
@UseFilters(AllExceptionsSocketFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChannelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private blockService: BlockService,
    private friendService: FriendService,
    private userService: UserService,
  ) {}

  @WebSocketServer()
  static server: Server;

  private logger = new Logger('ChannelGateway');

  async afterInit(server: Server) {
    const alluser: UserEntity[] = await this.userService.getAllUser();
    ChannelGateway.server = server;
    for (const user of alluser) {
      await this.userService.updateUserElements(user.id, {
        channelSocketId: null,
        userState: UserState.OFFLINE,
      });
    }
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || !client.id) {
      return client.disconnect();
    }
    if (user.channelSocketId) {
      this.logger.log('FUCKKING');
      client.emit('duplicateSocket');
      return client.disconnect();
    }
    this.logger.log(`Client connected: ${user.nickname}`);
    await this.userService.updateUserElements(user.id, {
      channelSocketId: client.id,
      userState: UserState.ONLINE,
    });
    user.channels.forEach((channel) => {
      client.join(channel.id.toString());
    });
    const toFriendList = await this.friendService.getFriendListByToId(user.id);
    for (const toFriendFrom of toFriendList) {
      const toFriend = await this.userService.getUserById(toFriendFrom.from);
      if (!toFriend.channelSocketId) continue;
      ChannelGateway.server
        .to(toFriend.channelSocketId)
        .emit('changeFriendState', {
          id: user.id,
          nickname: user.nickname,
          userState: UserState.ONLINE,
        });
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || client.id !== user.channelSocketId) return;
    this.logger.log(`Client distconnected: ${user.nickname}`);
    await this.userService.updateUserElements(user.id, {
      channelSocketId: null,
      userState: UserState.OFFLINE,
    });
    for (const friend of user.friends) {
      const friendSocketId = await this.userService.getUserById(friend.id);
      if (!friendSocketId?.channelSocketId) continue;
      ChannelGateway.server
        .to(friendSocketId.channelSocketId)
        .emit('changeFriendState', {
          id: user.id,
          nickname: user.nickname,
          userState: UserState.OFFLINE,
        });
    }
    client.rooms.clear();
  }

  static emitToAllClient(event: string, data: any) {
    ChannelGateway.server.emit(event, data);
  }

  static emitToClient(socketId: string, event: string, data: any) {
    ChannelGateway.server.to(socketId).emit(event, data);
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
      client.to(channelId.toString()).emit('channelMessage', [
        {
          nickname: null,
          userId: null,
          channelId: channelId,
          message: `${user.nickname}님이 입장하셨습니다.`,
        },
      ]);
      const channel = await this.channelService.getChannelByChannelId(
        channelId,
      );
      client.emit('addChannelToUserChannelList', channel);
      ChannelGateway.server.emit('changeChannelState', channel);
      //ChannelGateway.server.emit('changeChannelState', { method: 'MODIFY', channel });
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
    ChannelGateway.server.to(client.id).emit('visibleChannel', channels);
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
      const channelUser = await this.channelService.getChannelUserByIds(
        channelId,
        userId,
      );
      if (!channelUser)
        throw new NotFoundException({ error: 'User not found' });
      const channel = await this.channelService.getChannelByChannelId(
        channelId,
      );
      if (!channel) throw new NotFoundException({ error: `Channel not found` });
      if (targetUser.channelSocketId) {
        const targetUserSocket: Socket = ChannelGateway.server.sockets.get(
          targetUser.channelSocketId,
        );
        await this.channelService.kickChannelUser(user.id, channelUserInfo);
        targetUserSocket.rooms.delete(channelUserInfo.channelId.toString());
        targetUserSocket.emit('deleteChannelToUserChannelList', channel);
        ChannelGateway.server.to(channelId.toString()).emit('channelMessage', [
          {
            nickname: null,
            userId: null,
            channelId: channelId,
            message: `${targetUser.nickname}님이 강퇴당하셨습니다.`,
          },
        ]);
      }
      channel.userCount -= 1;
      if (channel.userCount > 0)
        ChannelGateway.server.emit('changeChannelState', channel);
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
    if (!user) throw new WsException('ban Error'); //ChannelGateway.server.to(client.id).emit('ban', { message: 'you are banned' });
    try {
      const { userId, channelId } = channelUserInfo;
      this.verifyNotSelfBanOrKick(user.id, userId);
      const targetUser = await this.userService.getUserById(
        channelUserInfo.userId,
      );
      if (!targetUser) throw new NotFoundException({ error: `User not found` });
      const channel = await this.channelService.getChannelByChannelId(
        channelId,
      );
      if (!channel) throw new NotFoundException({ error: `Channel not found` });
      ChannelGateway.server.to(channelId.toString()).emit('channelMessage', [
        {
          nickname: null,
          userId: null,
          channelId: channelId,
          message: `${targetUser.nickname} 님이 ${user.nickname}에 의해 밴을 당하셨음!`,
        },
      ]);
      channel.userCount -= 1;
      ChannelGateway.emitToAllClient('changeChannelState', channel);
      //await this.channelService.leaveChannel(userId, channelId);
      const result = await this.channelService.banChannelUser(
        user.id,
        channelUserInfo,
      );
      if (targetUser.channelSocketId) {
        const targetUserSocket = ChannelGateway.server.sockets.get(
          targetUser.channelSocketId,
        );
        targetUserSocket.rooms.delete(channelUserInfo.channelId.toString());
        targetUserSocket.emit('deleteChannelToUserChannelList', channel);
      }
      return result;
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
      const { userId, channelId } = channelUserInfo;
      const targetUser = await this.userService.getUserById(userId);
      if (!targetUser)
        throw new NotFoundException(`${userId} 아이디를 찾지 못함`);
      ChannelGateway.server.to(channelId.toString()).emit('channelMessage', [
        {
          nickname: null,
          userId: null,
          channelId: channelId,
          message: `${user.nickname}님이 ${targetUser.nickname}을 Admin으로 임명되었습니다.`,
        },
      ]);
      if (targetUser.channelSocketId) {
        const targetUserSocket = ChannelGateway.server.sockets.get(
          targetUser.channelSocketId,
        );
        targetUserSocket.emit('changeUserTypeToMod', { id: channelId });
      }
      await this.channelService.setAdmin(user.id, channelUserInfo);
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
      const result = await this.channelService.updatePassword(
        user.id,
        channelInfo,
      );
      if (result.password) result.password = undefined;
      ChannelGateway.emitToAllClient('changeChannelState', result);
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
      const result: ChannelEntity = await this.channelService.createChannel(
        channelInfo,
        channelUserIds,
      );
      if (!result) throw new WsException('create Error');
      const channelUsers = await this.channelService.getChannelUser(result.id);
      for (const channelUser of channelUsers) {
        const user = await this.userService.getUserById(channelUser.userId);
        const userSocket = ChannelGateway.server.sockets.get(
          user.channelSocketId,
        );
        if (!userSocket) continue;
        userSocket.join(result.id.toString());
      }
      result['ownerNickname'] = user.nickname;
      result['channelUser'] = channelUsers;
      client.emit('addChannelToUserChannelList', result);
      // 서버에있는 소켓들 에게 이벤트 보내기
      if (result.password) result.password = undefined;
      if (result.channelType !== ChannelType.PRIVATE)
        ChannelGateway.server.emit('addChannelToAllChannelList', result);
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
    const channel = await this.channelService.getChannelByChannelId(channelId);
    if (!channel) throw new NotFoundException(`${channel.id}를 못 찾음`);
    const result = await this.channelService.leaveChannel(user.id, channelId);
    client.to(channelId.toString()).emit('channelMessage', [
      {
        nickname: null,
        userId: null,
        channelId: channelId,
        message: `${user.nickname}님이 나가셨습니다.`,
      },
    ]);
    client.rooms.delete(channelId.toString());
    if (channel.password) channel.password = undefined;
    client.emit('deleteChannelToUserChannelList', channel);
    if (result) {
      channel['channelUser'] = await this.channelService.getChannelUser(
        channel.id,
      );
      ChannelGateway.server.emit('deleteChannelToAllChannelList', {
        id: channelId,
      });
    }
    client.emit('channelMessage', [
      {
        nickname: null,
        userId: null,
        channelId: channelId,
        message: `${user.nickname}님이 ${channel.channelName}방을 나가셨습니다.`,
      },
    ]);
    channel.userCount -= 1;
    if (channel.userCount > 0)
      ChannelGateway.emitToAllClient('changeChannelState', channel);
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
    const userSocket = ChannelGateway.server.sockets.get(user.channelSocketId);
    if (!targetUser || !targetUser.channelSocketId || !userSocket) return;
    ChannelGateway.server.to(targetUser.channelSocketId).emit(event, data);
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
      const userSocket = ChannelGateway.server.sockets.get(
        user.channelSocketId,
      );
      if (!userSocket) continue;
      userSocket.join(channelId.toString());
    }
    // 여기까지
    const userSocket = ChannelGateway.server.sockets.get(user.channelSocketId);
    if (!userSocket) return;
    if (await this.channelService.getChannelUserByIds(channelId, user.id)) {
      userSocket.to(channelId.toString()).emit(event, data);
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
    client.emit('getBlockList', blockList);
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
    try {
      const freindDto: FriendDto = {
        from: userId,
        to: blockUserId,
      };
      await this.friendService.deleteFriend(freindDto);
      await this.blockService.createBlock({
        from: userId,
        to: blockUserId,
      });
      const taragetUser = await this.userService.getUserById(blockUserId);
      if (!taragetUser) throw new WsException('User not found');
      this.logger.log('createBlock1');
      client.emit('createBlockToBlockList', {
        id: taragetUser.id,
        nickname: taragetUser.nickname,
        avatar: taragetUser.avatar,
        userState: taragetUser.userState,
      });
      this.logger.log('createBlock2');
    } catch (err) {}
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
    client.emit('deleteBlockToBlockList', { id: blockedUserId });
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
    client.emit('getFriendList', friendList);
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
    const friend: FriendEntity = await this.friendService
      .creatFriend({
        from: userId,
        to: followingUserId,
      })
      .catch((err) => {
        this.logger.log(err);
        throw new WsException(err);
      });
    const targetUser = await this.userService.getUserById(friend.to);
    client.emit('addFriendToFriendList', {
      id: targetUser.id,
      nickname: targetUser.nickname,
      avatar: targetUser.avatar,
      userState: targetUser.userState,
    });
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
    const targeUser = await this.userService.getUserById(followingUserId);
    client.emit('deleteFriendToFriendList', {
      userId: targeUser.id,
      nickname: targeUser.nickname,
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
    const { userId, channelId } = createChannelUserDto;
    const channel = await this.channelService.getChannelByChannelId(channelId);
    if (!channel) throw new NotFoundException({ error: `Channel not found` });
    const ret = await this.channelService.inviteUserToChannel(
      user.id,
      createChannelUserDto,
    );
    const targetUser = await this.userService.getUserById(userId);
    if (targetUser.channelSocketId) {
      const targetSocket: Socket = ChannelGateway.server.sockets.get(
        targetUser.channelSocketId,
      );
      targetSocket.join(ret.channelId.toString());
      targetSocket.to(ret.channelId.toString()).emit('channelMessage', [
        {
          nickname: null,
          userId: null,
          channelId: channelId,
          message: `${user.nickname} 님이 ${targetUser.nickname}을 초대되었습니다.`,
        },
      ]);
      targetSocket.emit('addChannelToUserChannelList', channel);
    }
    //return ret;
  }

  @SubscribeMessage('allUser')
  async getAllUser(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    return await this.userService.getAllUser();
  }

  @SubscribeMessage('socketTest')
  async socketTest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // Json { event : "getPaddleSize"
    //        data : {paddleSize : 3, x : 3 , y : 3}
    //  }
    //const user = await this.authService.getUserFromSocket(client);
    //if (!user) throw new WsException('Unauthorized');
    console.log(data);
    client.emit(data.event, data.data);
  }

  @SubscribeMessage('gameReady')
  async gameReady(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(data);
    client.emit('gameStart', data);
  }

  @SubscribeMessage('gameStart')
  async gameStart(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    this.logger.log(data);
    client.emit('gameStart', data);
  }
}
