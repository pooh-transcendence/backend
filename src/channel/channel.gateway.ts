import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
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

  afterInit(server: any) {
    this.logger.log('Initiated!');
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
      if (!result) throw new NotFoundException();
      client.rooms.add(result.channelId.toString());
    } catch (err) {
      this.logger.log(err);
      return err;
    }
  }

  async emitToChannel(user: any, channelId: number, event: string, ...arg) {
    const channel = this.server.to(channelId.toString());
    channel.emit(event, ...arg);
  }
}
