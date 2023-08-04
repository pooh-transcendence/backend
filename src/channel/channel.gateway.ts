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
import { ChannelService } from './channel.service';
import { Socket } from 'socket.io';
import {
  Inject,
  Logger,
  NotFoundException,
  ParseIntPipe,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { UserEntity, UserState } from 'src/user/user.entity';
import { CreateChanneUserDto } from './channel-user.dto';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { Server } from 'ws';
import {
  CreateChannelDto,
  MessageDto,
  UpdateChannelDto,
  UpdateChannelUserDto,
} from './channel.dto';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MesssageRepository } from './message.repository';
import { Cache } from 'cache-manager';

@WebSocketGateway({ namespace: 'channel' })
@UseFilters(AllExceptionsSocketFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ChannelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private channelService: ChannelService,
    private authService: AuthService,
    private userService: UserService,
    private messageRepository: MesssageRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @WebSocketServer()
  server: Server;
  private logger = new Logger('ChannelGateway');

  afterInit(server: Server) {
    this.logger.log('Initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || user.socketId) return client.disconnect();
    await this.userService.updateUserElements(user.id, {
      socketId: client.id,
      userState: UserState.ONCHAT,
    });
    user.channels.forEach((channel) => {
      client.join(channel.id.toString());
    });
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) return;
    await this.userService.updateUserElements(user.id, {
      socketId: null,
      userState: UserState.OFFCHAT,
    });
    for (const friend of user.friends) {
      const friendSocketId = await this.cacheManager.get(friend.id.toString());
      if (!friendSocketId) continue;
      this.server.to(friendSocketId).emit('ChangefriendState', {
        friendId: user.id,
        userState: UserState.OFFCHAT,
      });
    }
    client.rooms.clear();
  }

  @SubscribeMessage('join')
  async joinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelUserDto: CreateChanneUserDto,
  ) {
    try {
      const user = await this.authService.getUserFromSocket(client);
      if (!user) {
        client.disconnect();
      }
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
        userId,
        nickname: user.nickname,
        message,
      }).catch((err) => {});
    else throw new NotFoundException({ error: 'User or Channel not found' });
  }

  @SubscribeMessage('visible')
  async getVisibleChannel(@ConnectedSocket() client: Socket) {
    const channels = await this.channelService.getVisibleChannel();
    this.server.to(client.id).emit('visible', channels);
    return channels;
  }

  @SubscribeMessage('kick')
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
          message: `${user.username}님이 강퇴당하셨습니다.`,
        });
        targetUserSocket.rooms.delete(channelUserInfo.channelId.toString());
      }
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  @SubscribeMessage('ban')
  async banChannelUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelUserInfo: UpdateChannelUserDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('ban Error'); //this.server.to(client.id).emit('ban', { message: 'you are banned' });
    try {
      this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
      return await this.channelService.banChannelUser(user.id, channelUserInfo);
    } catch (err) {
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
      return err;
    }
  }

  @SubscribeMessage('create')
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
      return err;
    }
  }

  @SubscribeMessage('leave')
  async leaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('leaveA Error');
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
    if (user.blocks.includes(targetUserId)) return;
    const targetUser = await this.userService.getUserById(targetUserId);
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
}
