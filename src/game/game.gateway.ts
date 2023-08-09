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
import { UserService } from 'src/user/user.service';
import { Server } from 'ws';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private gameSocketMap: Map<number, Socket>;
  private queueSocketMap: any[];

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {
    this.gameSocketMap = new Map<number, Socket>();
    this.queueSocketMap = [];
  }

  @WebSocketServer()
  private server: Server;

  afterInit(server: any) {}

  handleConnection(client: any, ...args: any[]) {}
  handleDisconnect(client: any) {}

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.queueSocketMap.push(user);
    this.server.to(client.id).emit('joinQueue', { status: 'success' });
  }

  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue() {}
}
