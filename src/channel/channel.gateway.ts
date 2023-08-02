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
  Logger,
  NotFoundException,
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
import { channel } from 'diagnostics_channel';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';

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
  ) {}

  @WebSocketServer()
  server: Server;
  private logger = new Logger('ChannelGateway');

  @SubscribeMessage('join')
  async handleJoin(client: Socket, payload: { channelName: string }) {}

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
      client.join(result.channelId.toString());
      client.to(result.channelId.toString()).emit('joinChannel', {
        message: `${user.username}님이 입장하셨습니다.`,
      });
    } catch (err) {
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
        message,
      });
    else if (userId && !channelId)
      this.emitToUser(user, userId, 'userMessage', { userId, message });
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
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new NotFoundException({ error: ' User not found' });
    try {
      this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
      client
        .to(channelUserInfo.channelId.toString())
        .emit('kick', { message: 'you are kicked' });
      client.leave(channelUserInfo.channelId.toString());
      return await this.channelService.kickChannelUser(
        user.id,
        channelUserInfo,
      );
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
      return await this.channelService.updatePassword(user.id, channelInfo);
    } catch (err) {
      this.logger.log(err);
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
      return await this.channelService.createChannel(
        channelInfo,
        channelUserIds,
      );
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  async emitToUser(
    user: any,
    targetUserId: number,
    event: string,
    ...data: any
  ) {
    if (user.blocks.includes(targetUserId)) return;
    try {
      const targetUser = await this.userService.getUserById(targetUserId);
      const userSocket = this.server.sockets.get(user.socketId);
      if (!targetUser || !targetUser.socketId || !userSocket) return;
      this.server.to(targetUser.socketId).emit(event, data);
    } catch (err) {
      this.logger.error(err);
    }
  }

  async emitToChannel(
    user: UserEntity,
    channelId: number,
    event: string,
    ...data: any
  ) {
    const userSocket = this.server.sockets.get(user.socketId);
    if (!userSocket) return;
    userSocket.to(channelId.toString()).emit(event, data);
  }

  verifyRequestIdMatch(userId: number, requestBodyUserId: number) {
    if (userId !== requestBodyUserId)
      throw new WsException(`Id in request body doesn't match with your id`);
  }

  verifyNotSelfBanOrKick(fromUserId: number, toUserId: number) {
    if (fromUserId === toUserId)
      throw new WsException(`You can't ban or kick yourself`);
  }
}
