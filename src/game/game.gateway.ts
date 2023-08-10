import { GameService } from './game.service';
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
import { GameType } from './game.entity';
import { randomInt } from 'crypto';
import { UserEntity } from 'src/user/user.entity';
import { Game } from './game.class';
import { subscribe } from 'diagnostics_channel';
import { use } from 'passport';
import { RacketUpdatesDto } from './game.dto';
import { ConfigurableModuleBuilder } from '@nestjs/common';

@WebSocketGateway({ namespace: 'game' })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private gameMap: Map<number, Game>;
  private queueUser: UserEntity[];
  private gameToUserMap: Map<number, number>;

  constructor(
    private userService: UserService,
    private gameService: GameService,
    private authService: AuthService,
  ) {
    this.gameMap = new Map<number, Game>();
    this.queueUser = [];
    this.gameToUserMap = new Map<number, number>();
  }

  @WebSocketServer()
  private server: Server;

  afterInit(server: any) {}

  handleConnection(client: any) {}

  async handleDisconnect(client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) return;
    this.queueUser = this.queueUser.filter((u) => u.id !== user.id);
    //this.gameSocketMap.delete(user.userId);
    this.userService.updateUserElements(user.userId, { socketId: null });
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.queueUser.push(user);
    this.server.to(client.id).emit('joinQueue', { status: 'success' });
    // queue 2명 이상이면 game 시작
    while (this.queueUser.length >= 2) {
      await this.getGame();
    }
  }

  // 랜덤매칭 로딩 중 취소
  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.queueUser = this.queueUser.filter((u) => u.id !== user.id);
    this.server.to(client.id).emit('leaveQueue', { status: 'success' });
  }

  // game 시작
  async getGame() {
    let gameUserCount = 0;
    let user1: UserEntity;
    let user2: UserEntity;
    let user1SocketId;
    let user2SocketId;

    // user1 pop
    while (this.queueUser.length >= 2) {
      // user1 socket 연결 확인
      user1 = this.queueUser.shift();
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
    while (this.queueUser.length >= 1) {
      // user2 socket 연결 확인
      user2 = this.queueUser.shift();
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

    // user1 연결 후 user2 연결이 안됐을 때
    if (gameUserCount === 1) {
      this.queueUser.push(user1);
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
    const gameEntity = await this.gameService.createGame(createGameDto);
    // user1과 user2에게 game start emit
    this.server.to(user1SocketId).emit('getGame', {
      gameInfo: createGameDto,
      whoAmI: user1.id === gameEntity.winner.id ? 'left' : 'right',
    });
    this.server.to(user2SocketId).emit('getGame', {
      gameInfo: createGameDto,
      whoAmI: user2.id === gameEntity.winner.id ? 'left' : 'right',
    });
    const socket1 = this.server.sockets.sockets.get(user1SocketId);
    const socket2 = this.server.sockets.sockets.get(user2SocketId);
    socket1.join('game : ' + gameEntity.id.toString());
    socket2.join('game : ' + gameEntity.id.toString());
    this.gameToUserMap.set(user1.id, gameEntity.id);
    this.gameToUserMap.set(user2.id, gameEntity.id);
    this.gameMap.set(gameEntity.id, new Game(gameEntity, this.userService));
  }

  // socket 연결 여부 확인
  private isSocketConnected(socketId: string): boolean {
    return this.server.sockets.sockets.has(socketId)?.connected;
  }

  @SubscribeMessage('updateRacket')
  handleDownPress(
    @ConnectedSocket() client: Socket,
    @MessageBody() racketUpdate: RacketUpdatesDto,
  ) {
    const userId = this.authService.getUserIdFromSocket(client);
    if (!userId) return;
    const gameId = this.gameToUserMap.get(userId);
    if (!gameId) return;
    const game: Game = this.gameMap.get(gameId);
    if (!game) return;
    game.getUpdateRacket(racketUpdate);
  }

  private gameStart(game: Game) {
    game.init();
    let gameEntity;
    while (1) {
      const ret = game.update();
      this.server.to(game.getRoomId()).emit('gameUpdate', ret);
      if (ret.isGetScore) game.init();
      if (game.isGameOver()) {
        gameEntity = game.exportToGameEntity();
        break;
      }
    }

    this.gameMap.delete(gameEntity.id);
    this.gameToUserMap.delete(gameEntity.participants[0].id);
    this.gameToUserMap.delete(gameEntity.participants[1].id);
    //this.gameService.updateGame(gameEntity.id, gameEntity);
  }
}
