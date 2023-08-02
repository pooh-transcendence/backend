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
import { MessageDto } from './channel.dto';

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

  @SubscribeMessage('joinChannel')
  async joinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelUserDto: CreateChanneUserDto,
  ) {
    try {
      const user = await this.authService.getUserFromSocket(client);
      if (!user) {
        client.disconnect();
      }
      //this.channelService.verifyRequestIdMatch(user.id, channelUserInfo.userId);
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
}
