import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { randomInt } from 'crypto';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { FriendService } from 'src/friend/friend.service';
import { UserEntity, UserState } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Server } from 'ws';
import { Game } from './game.class';
import {
  GameUpdateDto,
  RacketUpdatesDto,
  CreateOneToOneGameDto,
} from './game.dto';
import { GameEntity, GameStatus, GameType } from './game.entity';
import { GameService } from './game.service';

@WebSocketGateway({ namespace: 'game' })
@UseFilters(AllExceptionsSocketFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private gameMap: Map<number, Game>;
  private queueUser: UserEntity[];
  private gameToUserMap: Map<number, number>;
  logger: Logger = new Logger('GameGateway');

  constructor(
    private userService: UserService,
    private gameService: GameService,
    private authService: AuthService,
    private friendService: FriendService,
  ) {
    this.gameMap = new Map<number, Game>();
    this.queueUser = [];
    this.gameToUserMap = new Map<number, number>();
  }

  @WebSocketServer()
  private server: Server;

  private connectedSockets: Map<string, Socket> = new Map();

  async afterInit(server: Server) {
    this.logger.log('afterInit');
    //this.server = server;
    const alluser: UserEntity[] = await this.userService.getAllUser();
    for (const user of alluser) {
      if (user.gameSocketId) {
        this.server.sockets.sockets.get(user.gameSocketId)?.disconnect();
      }
      await this.userService.updateUserElements(user.id, {
        gameSocketId: null,
        userState: UserState.OFFLINE,
      });
    }
  }

  async handleConnection(client: any) {
    const user = await this.authService.getUserFromSocket(client);
    if (!client.id || !user || user.gameSocketId) return client.disconnect();
    this.logger.log(
      `Game Client connected: ${user.nickname}, clientId : ${client.id}`,
    );
    await this.userService.updateUserElements(user.id, {
      gameSocketId: client.id,
      userState: UserState.INGAME,
    });
    const toFriendList = await this.friendService.getFriendListByToId(user.id);
    for (const toFriendFrom of toFriendList) {
      const toFriend = await this.userService.getUserById(toFriendFrom.from);
      if (!toFriend.channelSocketId) continue;
      this.server.to(toFriend.channelSocketId).emit('changeFriendState', {
        id: user.id,
        nickname: user.nickname,
        userState: UserState.INGAME,
      });
    }
    this.connectedSockets.set(client.id, client);
  }

  async handleDisconnect(client: Socket) {
    const __user = await this.authService.getUserFromSocket(client);
    if (!__user) return;
    const user = await this.userService.getUserById(__user.id);
    if (!__user || client.id !== user.gameSocketId) return;
    this.queueUser = this.queueUser.filter((u) => u.id !== __user.id);
    //console.log('queueUser: ' + this.queueUser.length);
    this.logger.log(`Game Client disconnected: ${__user.nickname}`);
    //this.gameSocketMap.delete(user.userId);
    await this.userService.updateUserElements(__user.id, {
      gameSocketId: null,
      userState: user.channelSocketId ? UserState.ONLINE : UserState.OFFLINE,
    });
    this.connectedSockets.delete(client.id);
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(@ConnectedSocket() client: Socket) {
    const __user = await this.authService.getUserFromSocket(client);
    if (!__user) client.disconnect();
    const user = await this.userService.getUserById(__user.id);
    if (!this.queueUser.find((u) => u.id === user.id)) {
      this.queueUser.push(user);
      this.logger.log(`${user.nickname} JOIN QUEUE`);
    }
    this.server.to(client.id).emit('joinQueue', { status: 'success' });
    // queue 2명 이상이면 game 시작
    while (this.queueUser.length >= 1) {
      const ret = await this.generateGame();
      this.logger.log(`generateGame: ${ret}`);
      if (!ret) break;
    }
  }

  private async generateGame(): Promise<boolean> {
    const user1 = this.queueUser.shift();
    if (!user1 || !this.isSocketConnected(user1.gameSocketId)) {
      return false;
    }
    // const user2 = this.queueUser.shift();
    // if (!user2 || !this.isSocketConnected(user2.gameSocketId)) {
    //   this.queueUser.push(user1);
    //   return false;
    // }
    await this.gameReady(user1, null); //user2);
    return true;
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
  async gameReady(user1: any, user2: any) {
    this.logger.log('gameReady');
    //this.logger.log(`gameReady: ${user1.nickname} vs ${user2.nickname}`);
    const createGameDto = {
      participants: [user1.id, user2.id],
      gameType: GameType.LADDER,
      ballSpeed: randomInt(1, 3),
      ballCount: randomInt(1, 3),
      winner: null,
      loser: null,
    };
    this.logger.log('prev createGame');
    const gameEntity = await this.gameService.createGame(createGameDto);
    // console.log('createGame: ' + gameEntity);
    const game = new Game(gameEntity, this.userService);
    const socket1 = this.server.sockets.get(user1.gameSocketId);
    this.logger.log('after createGame');
    // this.logger.log('socket1: ' + user1.gameSocketId);
    //const socket2 = this.server.sockets.get(user2.gameSocketId);
    // this.logger.log('socket2: ' + user2.gameSocketId);
    socket1.join(game.getRoomId());
    //socket2.join(game.getRoomId());
    this.gameToUserMap.set(user1.id, gameEntity.id);
    //this.gameToUserMap.set(user2.id, gameEntity.id);
    // this.logger.log('before game');
    const gameUpdateDto: GameUpdateDto = game.init(false);
    this.logger.log('after game');
    this.gameMap.set(gameEntity.id, game);
    this.logger.log('set After game');
    // user1과 user2에게 game ready emit
    this.server.to(user1.gameSocketId).emit('gameReady', {
      gameInfo: gameUpdateDto,
      whoAmI: user1.id === gameEntity.winner.id ? 'left' : 'right',
      nickname: user1.nickname,
    });
    // this.server.to(user2.gameSocketId).emit('gameReady', {
    //   gameInfo: gameUpdateDto,
    //   whoAmI: user2.id === gameEntity.winner.id ? 'left' : 'right',
    //   nickname: user2.nickname,
    // });
  }
  // socket 연결 여부 확인
  private isSocketConnected(socketId: string): boolean {
    //return this.connectedSockets.has(socketId);
    return this.server.sockets.get(socketId)?.connected;
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

  @SubscribeMessage('gameStart')
  gameStart(@ConnectedSocket() client: Socket) {
    const userId = this.authService.getUserIdFromSocket(client);
    if (!userId) {
      // this.logger.log('gameStart: userId is null');
      client.disconnect();
      return;
    }
    // this.logger.log(`gameStart: ${userId}`);
    const gameId = this.gameToUserMap.get(userId);
    if (!gameId) return;
    const game: Game = this.gameMap.get(gameId);
    // this.logger.log('gameStart');
    // 1초에 60번 update
    const timerId = setInterval(() => {
      // this.logger.log('gameLoop');
      this.gameLoop(game);
      if (game.isGameOver()) {
        this.logger.log(`${userId} :  ${game.getRoomId()} is  gameOver`);
        const gameEntity = game.exportToGameEntity();
        gameEntity.gameStatus = GameStatus.FINISHED;
        this.gameService.updateGame(gameEntity);
        clearInterval(timerId);
      }
    }, 1000 / 60);
  }

  private gameLoop(game: Game) {
    // this.logger.log('gameLoop start');
    const updateInfo = game.update();
    const roomId: string = game.getRoomId();
    if (updateInfo.isGetScore) {
      this.logger.log(
        `${updateInfo.participants[0]} vs ${updateInfo.participants[1]} score : ` +
          updateInfo.score,
      );
      game.init(true);
    }
    this.server.to(roomId).emit('gameUpdate', updateInfo);
    if (game.isGameOver()) {
      const gameEntity: GameEntity = game.exportToGameEntity();

      // gameEntity 저장
      this.gameService.updateGame(gameEntity);
      gameEntity.winner.accessToken = undefined;
      gameEntity.winner.refreshToken = undefined;
      gameEntity.winner.ftId = undefined;
      gameEntity.winner.winnerGame = undefined;
      gameEntity.winner.loserGame = undefined;
      gameEntity.winner.channelSocketId = undefined;
      gameEntity.winner.gameSocketId = undefined;

      gameEntity.loser.accessToken = undefined;
      gameEntity.loser.refreshToken = undefined;
      gameEntity.loser.ftId = undefined;
      gameEntity.loser.winnerGame = undefined;
      gameEntity.loser.loserGame = undefined;
      gameEntity.loser.channelSocketId = undefined;
      gameEntity.loser.gameSocketId = undefined;

      this.server.to(roomId).emit('gameOver', gameEntity);

      this.gameMap.delete(gameEntity.id);
      this.gameToUserMap.delete(gameEntity.winner.id);
      this.gameToUserMap.delete(gameEntity.loser.id);

      // leave room
      this.server.socketsLeave(roomId);
    }
  }

  @SubscribeMessage('socketTest')
  async socketTest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    client.emit(data.event, data.data);
  }

  @SubscribeMessage('getAllWaitingGame')
  async getAllWaitingGame(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const games = await this.gameService.getAllWaitingGame(user.id);
    client.emit('getAllActiveGame', games);
  }

  @SubscribeMessage('createOneToOneGame')
  async createOneToOneGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('createOneToOneGameDto')
    createOneToOneGameDto: CreateOneToOneGameDto,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    await this.gameService.createOneToOneGame(user.id, createOneToOneGameDto);
    client.emit('createOneToOneGame', { status: 'success' });
  }

  @SubscribeMessage('startOneToOneGame')
  async startOneToOneGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('gameId') gameId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const game = await this.gameService.startOneToOneGame(user, gameId);
    client.emit('startOneToOneGame', game);
  }
}
