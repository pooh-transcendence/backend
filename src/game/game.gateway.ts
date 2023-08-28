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
import { UserEntity, UserState } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Server } from 'ws';
import { Game } from './game.class';
import { GameUpdateDto, RacketUpdatesDto } from './game.dto';
import { GameEntity, GameType } from './game.entity';
import { GameService } from './game.service';
import { FriendService } from 'src/friend/friend.service';

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

  async afterInit(server: Server) {
    this.logger.log('init');
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
    this.logger.log(`Game Client connected: ${user.nickname}`);
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
  }

  async handleDisconnect(client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user || client.id !== user.gameSocketId) return;
    this.queueUser = this.queueUser.filter((u) => u.id !== user.id);
    this.logger.log(`Game Client disconnected: ${user.nickname}`);
    //this.gameSocketMap.delete(user.userId);
    await this.userService.updateUserElements(user.id, {
      gameSocketId: null,
      //userState: UserState.ONLINE,
    });
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.queueUser.push(user);
    this.server.to(client.id).emit('joinQueue', { status: 'success' });
    // queue 2명 이상이면 game 시작
    console.log(this.queueUser);
    while (this.queueUser.length >= 2) {
      await this.gameReady();
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

  // @SubscribeMessage('gameReady')
  // async handleGameReady(@ConnectedSocket() client: Socket) {
  //   const userId = this.authService.getUserIdFromSocket(client);
  //   if (!userId) client.disconnect();
  //   const gameId = this.gameToUserMap.get(userId);
  //   if (!gameId) return;
  //   // game start
  //   this.gameStart(this.gameMap.get(gameId));
  // }

  // game 시작
  async gameReady() {
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
      // user1SocketId = await this.userService.getUserElementsById(user1.id, [
      //   'gameSocketId',
      // ]);
      // console.log('user1SocketId', user1SocketId);
      if (
        !user1.gameSocketId //SocketId // ||
        //!this.isSocketConnected(user1SocketId.gameSocketId)
      ) {
        continue;
      } else {
        gameUserCount++;
        break;
      }
    }

    //if (gameUserCount < 1) return; // user1이 없을 때
    // user2 pop
    while (this.queueUser.length >= 1) {
      // user2 socket 연결 확인
      user2 = this.queueUser.shift();
      // socketId 확인
      // user2SocketId = await this.userService.getUserElementsById(user2.id, [
      //   'gameSocketId',
      // ]);
      if (
        !user2.gameSocketId //SocketId //||
        //!this.isSocketConnected(user2SocketId.gameSocketId)
      ) {
        continue;
      } else {
        gameUserCount++;
        break;
      }
    }
    // user1 연결 후 user2 연결이 안됐을 때
    // if (gameUserCount === 1) {
    //   this.queueUser.push(user1);
    //   return;
    // }
    console.log('HI');
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

    const socket1 = this.server.sockets.get(user1.gameSocketId);
    const socket2 = this.server.sockets.get(user2.gameSocketId);
    //console.log(socket1, socket2);
    socket1.join('game : ' + gameEntity.id.toString());
    socket2.join('game : ' + gameEntity.id.toString());
    console.log('__ 205 __');
    this.gameToUserMap.set(user1.id, gameEntity.id);
    this.gameToUserMap.set(user2.id, gameEntity.id);
    const game = new Game(gameEntity, this.userService);
    console.log('__ 209 __');
    const gameUpdateDto: GameUpdateDto = game.init();
    console.log('__ 211 __');
    this.gameMap.set(gameEntity.id, game);
    console.log('__ 213 __');
    // user1과 user2에게 game ready emit
    console.log('FUCK');
    this.server.to(user1.gameSocketId).emit('gameReady', {
      gameInfo: gameUpdateDto,
      whoAmI: user1.id === gameEntity.winner.id ? 'left' : 'right',
      nickname: user1.nickname,
    });
    this.server.to(user2.gameSocketId).emit('gameReady', {
      gameInfo: gameUpdateDto,
      whoAmI: user2.id === gameEntity.winner.id ? 'left' : 'right',
      nickname: user2.nickname,
    });
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

  @SubscribeMessage('gameStart')
  gameStart(@ConnectedSocket() client: Socket) {
    const userId = this.authService.getUserIdFromSocket(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    const gameId = this.gameToUserMap.get(userId);
    if (!gameId) return;
    const game: Game = this.gameMap.get(gameId);
    this.logger.log('gameStart');
    // 1초에 60번 update
    const timerId = setInterval(() => {
      this.gameLoop(game);
      if (game.isGameOver()) {
        clearInterval(timerId);
      }
    }, 1000 / 60);
    // while (1) {
    //   const ret = game.update();
    //   this.server.to(game.getRoomId()).emit('gameUpdate', ret);
    //   if (ret.isGetScore) game.init();
    //   if (game.isGameOver()) {
    //     const gameEntity = game.exportToGameEntity();
    //     this.gameMap.delete(gameEntity.id);
    //     this.gameToUserMap.delete(gameEntity.winner.id);
    //     this.gameToUserMap.delete(gameEntity.loser.id);
    //     break;
    //   }
  }

  private gameLoop(game: Game) {
    const updateInfo = game.update();
    const roomId: string = game.getRoomId();
    this.server.to(roomId).emit('gameUpdate', updateInfo);
    if (updateInfo.isGetScore) game.init();
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
    // Json { event : "getPaddleSize"
    //        data : {paddleSize : 3, x : 3 , y : 3}
    //  }
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    client.emit(data.event, data.data);
  }
}
