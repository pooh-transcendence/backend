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
import { ChannelGateway } from 'src/channel/channel.gateway';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { FriendService } from 'src/friend/friend.service';
import { UserEntity, UserState } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { Server } from 'ws';
import { Game } from './game.class';
import { CreateGameDto, GameUpdateDto, RacketUpdatesDto } from './game.dto';
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
  static server: Server;
  static setUserId : Set<number> = new Set<number>();

  async afterInit(server: Server) {
    this.logger.log('afterInit');
    GameGateway.server = server;
    const allUser: UserEntity[] = await this.userService.getAllUser();
    for (const user of allUser) {
      if (user.gameSocketId) {
        GameGateway.server.sockets.get(user.gameSocketId)?.disconnect();
      }
      await this.userService.updateUserElements(user.id, {
        gameSocketId: null,
        //userState: UserState.OFFLINE,
      });
    }
  }

  async handleConnection(client: any) {
    const user = await this.authService.getUserFromSocket(client);
    if (!client.id || !user || user.gameSocketId) return client.disconnect();
    this.logger.log(
      `Game Client connected: ${user.nickname}, clientId : ${client.id}`,
    );
    client.rooms.clear();
    await this.userService.updateUserElements(user.id, {
      gameSocketId: client.id,
      //userState: UserState.INGAME,
    });
    // const toFriendList = await this.friendService.getFriendListByToId(user.id);
    // for (const toFriendFrom of toFriendList) {
    //   const toFriend = await this.userService.getUserById(toFriendFrom.from);
    //   if (!toFriend.channelSocketId) continue;
    //   this.server.to(toFriend.channelSocketId).emit('changeFriendState', {
    //     id: user.id,
    //     nickname: user.nickname,
    //   });
    // }
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
      //userState: user.channelSocketId ? UserState.ONLINE : UserState.OFFLINE,
    });
    if (GameGateway.setUserId.has(__user.id))
      GameGateway.setUserId.delete(__user.id);
  }

  @SubscribeMessage('joinQueue')
  async handleJoinQueue(@ConnectedSocket() client: Socket) {
    const __user = await this.authService.getUserFromSocket(client);
    if (!__user) client.disconnect();
    const user = await this.userService.getUserById(__user.id);
    if (!user) throw new WsException('Unauthorized');
    user.gameSocketId = client.id;
    if (GameGateway.setUserId.has(user.id)) return ;

    if (!this.queueUser.find((u) => u.id === user.id)) {
      this.queueUser.push(user);
      this.logger.log(`${user.nickname} JOIN QUEUE`);
      GameGateway.setUserId.add(user.id);
      GameGateway.server.to(client.id).emit('joinQueue', { status: 'success' });
    }
    // queue 2명 이상이면 game 시작
    while (this.queueUser.length >= 2) {
      const ret = await this.generateGame(GameType.LADDER);
      this.logger.log(`generateGame: ${ret}`);
      if (!ret) break;
    }
  }

  private async generateGame(gameType: GameType): Promise<boolean> {
    const user1 = this.queueUser.shift();
    GameGateway.setUserId.delete(user1.id);
    if (!user1 || !this.isSocketConnected(user1.gameSocketId)) {
      this.logger.log('user1 is null');
      return false;
    }
    const user2 = this.queueUser.shift();
    if (!user2 || !this.isSocketConnected(user2.gameSocketId)) {
      this.logger.log('user2 is null');
      this.queueUser.push(user1);
      GameGateway.setUserId.add(user1.id);
      return false;
    }
    GameGateway.setUserId.delete(user2.id);
    this.logger.log(
      'generateGame: ' + user1.nickname + ' vs ' + user2.nickname,
    );
    const createGameDto: CreateGameDto = {
      participants: [user1.id, user2.id],
      gameType: gameType,
      ballSpeed: randomInt(1, 3),
      racketSize: randomInt(1, 3),
      winner: null,
      loser: null,
    };
    this.logger.log('prev createGame');
    const gameEntity = await this.gameService.createGame(createGameDto);
    await this.gameReady(user1, user2, gameEntity);
    return true;
  }

  // 랜덤매칭 로딩 중 취소
  @SubscribeMessage('leaveQueue')
  async handleLeaveQueue(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) client.disconnect();
    this.logger.log(`${user.nickname} leave Queue`);
    this.logger.log('leaveQueue: ' + user.nickname);
    this.queueUser = this.queueUser.filter((u) => u.id !== user.id);
    GameGateway.setUserId.delete(user.id);
    GameGateway.server.to(client.id).emit('leaveQueue', { status: 'success' });
  }

  // game 시작
  public async gameReady(
    user1: UserEntity,
    user2: UserEntity,
    gameEntity: GameEntity,
  ) {
    this.logger.log(`gameReady: ${user1.nickname} vs ${user2.nickname}`);
    // console.log('createGame: ' + gameEntity);
    const game = new Game(gameEntity, this.userService);
    const socket1 = GameGateway.server.sockets.get(user1.gameSocketId);
    this.logger.log('after createGame');
    // this.logger.log('socket1: ' + user1.gameSocketId);
    const socket2 = GameGateway.server.sockets.get(user2.gameSocketId);
    // this.logger.log('socket2: ' + user2.gameSocketId);
    socket1.join(game.getRoomId());
    socket2.join(game.getRoomId());
    this.gameToUserMap.set(user1.id, gameEntity.id);
    this.gameToUserMap.set(user2.id, gameEntity.id);
    const gameUpdateDto: GameUpdateDto = game.init(false);
    this.gameMap.set(gameEntity.id, game);
    // user1과 user2에게 game ready emit
    const users = [user1, user2];
    users.forEach(async (user) => {
      const toFriendList = await this.friendService.getFriendListByToId(
        user.id,
      );
      for (const toFriendFrom of toFriendList) {
        const toFriend = await this.userService.getUserById(toFriendFrom.from);
        if (!toFriend.channelSocketId) continue;
        ChannelGateway.server
          .to(toFriend.channelSocketId)
          .emit('changeFriendState', {
            id: user.id,
            nickname: user.nickname,
            userState: UserState.INGAME,
          });
      }
      GameGateway.server.to(user.gameSocketId).emit('gameReady');
      GameGateway.server.to(user.gameSocketId).emit('gameStart', {
        gameData: gameUpdateDto,
        whoAmI: user.id === gameEntity.winner.id ? 'left' : 'right',
        nickname: user.nickname,
        paddleSize: gameEntity.racketSize * 90,
      });
      await this.userService.updateUserElements(user.id, {
        userState: UserState.INGAME,
      });
    });
  }

  // socket 연결 여부 확인
  private isSocketConnected(socketId: string): boolean {
    //return this.connectedSocgaets.has(socketId);
    return GameGateway.server.sockets.get(socketId)?.connected;
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
    //game.getUpdateRacket(racketUpdate);
    game.tmpGetUpdateRacket(racketUpdate);
  }

  @SubscribeMessage('gameStart')
  async gameStart(@ConnectedSocket() client: Socket) {
    const userId = this.authService.getUserIdFromSocket(client);
    if (!userId) {
      client.disconnect();
      return;
    }
    this.logger.log(`gameStart: ${userId}`);
    const gameId = this.gameToUserMap.get(userId);
    if (!gameId) return;
    const game: Game = this.gameMap.get(gameId);
    // this.logger.log('gameStart');
    // 1초에 60번 update
    this.logger.log(`start Game Type ! ! is ${game.getType()}`);
    if (game.readyCount()) return;
    await this.sleep(1000 * 3);
    const timerId: NodeJS.Timeout = setInterval(async () => {
      // this.logger.log('gameLoop');
      this.gameLoop(game);
      if (
        game.isGameOver() ||
        !this.isSocketConnected(game.getPlayer1().gameSocketId) ||
        !this.isSocketConnected(game.getPlayer2().gameSocketId)
      ) {
        clearInterval(timerId);
        await this.gameEnd(game);
      }
    }, 1000 / 60);
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async gameEnd(game: Game) {
    if (game.isLoop()) return;
    game.setLoop(true);
    this.logger.log(
      `${game.getPlayer1().nickname} ${
        game.getPlayer2().nickname
      }:  ${game.getRoomId()} is  gameOver`,
    );
    const isConnect = [
      this.isSocketConnected(game.getPlayer1().gameSocketId),
      this.isSocketConnected(game.getPlayer2().gameSocketId),
    ];
    game.getGiveUp(isConnect);
    game.setGameOver(true);
    const gameEntity = game.exportToGameEntity();
    gameEntity.gameStatus = GameStatus.FINISHED;
    this.gameService.updateGame(gameEntity);

    const users = [game.getPlayer1(), game.getPlayer2()];
    if (!users) return;
    users.forEach(async (user) => {
      const socket = GameGateway.server.sockets.get(user.gameSocketId);
      if (socket) socket.emit('gameEnd', gameEntity);
      socket?.rooms.delete(game.getRoomId());
      const friendLists = await this.friendService.getFriendListByToId(user.id);
      for (const friendList of friendLists) {
        const friend = await this.userService.getUserById(friendList.from);
        if (!friend.channelSocketId) continue;
        ChannelGateway.server
          .to(friend.channelSocketId)
          .emit('changeFriendState', {
            id: user.id,
            nickname: user.nickname,
            userState: UserState.ONLINE,
          });
      }
      await this.userService.updateUserElements(user.id, {
        userState: UserState.ONLINE,
      });
    });
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
    GameGateway.server.to(roomId).emit('gameUpdate', updateInfo);
    if (game.isLoop()) {
      // // gameEntity 저장
      // this.gameService.updateGame(gameEntity);
      // gameEntity.winner.accessToken = undefined;
      // gameEntity.winner.refreshToken = undefined;
      // gameEntity.winner.ftId = undefined;
      // gameEntity.winner.winnerGame = undefined;
      // gameEntity.winner.loserGame = undefined;
      // gameEntity.winner.channelSocketId = undefined;
      // gameEntity.winner.gameSocketId = undefined;

      // gameEntity.loser.accessToken = undefined;
      // gameEntity.loser.refreshToken = undefined;
      // gameEntity.loser.ftId = undefined;
      // gameEntity.loser.winnerGame = undefined;
      // gameEntity.loser.loserGame = undefined;
      // gameEntity.loser.channelSocketId = undefined;
      // gameEntity.loser.gameSocketId = undefined;

      // GameGateway.server.to(roomId).emit('gameOver', gameEntity);
      //this.gameEnd(game);
      const gameEntity: GameEntity = game.exportToGameEntity();
      this.gameMap.delete(gameEntity.id);
      this.gameToUserMap.delete(gameEntity.winner.id);
      this.gameToUserMap.delete(gameEntity.loser.id);
      // leave room
      GameGateway.server.socketsLeave(roomId);
    }
  }

  @SubscribeMessage('startOneToOneGame')
  async startOneToOneGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('gameId') gameId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const game = await this.gameService.startOneToOneGame(user, gameId);
    GameGateway.setUserId.delete(game.winner.id);
    GameGateway.setUserId.delete(game.loser.id);
    this.gameReady(game.winner, game.loser, game);
  }

  static emitToAllClient(event: string, data: any) {
    GameGateway.server.emit(event, data);
  }

  static emitToClient(socketId: string, event: string, data: any) {
    GameGateway.server.to(socketId).emit(event, data);
  }
}
