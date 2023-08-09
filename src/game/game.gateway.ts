import { GameService } from './game.service';
import {
  ConnectedSocket,
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
import { GameType } from './game.entity';
import { randomInt } from 'crypto';
import { UserEntity } from 'src/user/user.entity';

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private gameSocketMap: Map<number, Socket>;
  private queueSocketMap: any[];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private gameService: GameService,
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
  async handleJoinQueue(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.queueSocketMap.push(user);
    this.server.to(client.id).emit('joinQueue', { status: 'success' });
    // queue 2명 이상이면 game 시작
    if (this.queueSocketMap.length >= 2) {
      await this.startGame();
    }
  }

  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue() {}

  // game 시작
  async startGame() {
    let gameUserCount = 0;
    let user1: UserEntity;
    let user2: UserEntity;
    let user1SocketId;
    let user2SocketId;

    // user1 pop
    while (this.queueSocketMap.length >= 2) {
      // user1 socket 연결 확인
      user1 = this.queueSocketMap.pop();
      // socketId 확인
      user1SocketId = await this.userService.getUserElementsById(user1.id, [
        'socketId',
      ]);
      if (!user1SocketId || !this.isSocketConnected(user1SocketId.socketId)) {
        continue;
      } else {
        gameUserCount++;
        break;
      }
    }
    if (gameUserCount < 1) return; // user1이 없을 때
    // user2 pop
    while (this.queueSocketMap.length >= 1) {
      // user2 socket 연결 확인
      user2 = this.queueSocketMap.pop();
      // socketId 확인
      user2SocketId = await this.userService.getUserElementsById(user2.id, [
        'socketId',
      ]);
      if (!user2SocketId || !this.isSocketConnected(user2SocketId.socketId)) {
        continue;
      } else {
        gameUserCount++;
        break;
      }
    }

    // user1과 user2가 모두 socket 연결이 되어있을 때
    if (gameUserCount !== 2) {
      return;
    }
    // createGameDto 생성
    const createGameDto = {
      participants: [user1.id, user2.id],
      gameType: GameType.LADDER,
      ballSpeed: randomInt(1, 3),
      ballCount: randomInt(1, 3),
      winner: null,
      loser: null,
    };
    await this.gameService.createGame(createGameDto);
    // user1과 user2에게 game start emit
    this.server
      .to(user1SocketId)
      .emit('startGame', { status: 'success', gameInfo: createGameDto });
    this.server
      .to(user2SocketId)
      .emit('startGame', { status: 'success', gameInfo: createGameDto });
    // user1, user2 queue에서 제거
    this.queueSocketMap.shift();
    this.queueSocketMap.shift();
  }

  // socket 연결 여부 확인
  private isSocketConnected(socketId: string): boolean {
    return this.server.sockets.sockets.has(socketId)?.connected;
  }
}
