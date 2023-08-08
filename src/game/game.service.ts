import { Injectable, NotFoundException } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { CreateGameDto } from './game.dto';
import { GameEntity, GameType } from './game.entity';
import { UserRepository } from 'src/user/user.repository';
import { NumberSchema } from 'joi';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private userRepository: UserRepository,
    private userService: UserService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
    const [id1, id2] = createGameDto.participants;
    const user1 = await this.userRepository.getUserByUserId(id1);
    const user2 = await this.userRepository.getUserByUserId(id2);
    if (!user1 || !user2) throw new NotFoundException("Couldn't find users");
    createGameDto.winner = user1;
    createGameDto.loser = user2;
    return await this.gameRepository.createGame(createGameDto);
  }

  async getAllGame(): Promise<GameEntity[]> {
    return await this.gameRepository.getAllGame();
  }

  async getGameByUserId(userId: number): Promise<GameEntity[]> {
    return await this.gameRepository.getGameByUserId(userId);
  }

  async getGameByGameId(gameId: number): Promise<GameEntity> {
    return await this.gameRepository.getGameByGameId(gameId);
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    await this.gameRepository.deleteGameByGameId(gameId);
  }

  //
}

export enum GameStatus {
  DEFAULT = 'DEFAULT',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

class Game {
  private id: number;
  private ballVelocity: number;
  private racketVelocity: number;
  private status: GameStatus;
  private ball; // [x, y, radion]
  private score;
  private winner: number;
  private loser: number;
  private type: GameType;
  private ballCount: number;
  private isGiveUp: boolean;
  private giveUpUser: number;
  private player1: UserEntity;
  private player2: UserEntity;
  private racket; // = new Array(2);

  constructor(
    private gameInfo: GameEntity,
    private userService: UserService,

    private readonly canvasWidth = 1150,
    private readonly canvasHeight = 600,
    private readonly racketHeight = 150,
    private readonly racketWidth = 30,
    private readonly maxScore = 6,
  ) {
    this.player1 = gameInfo.winner;
    this.player2 = gameInfo.loser;
    this.ballVelocity = 10;
    this.racketVelocity = 10;
    this.score[this.player1.id] = 0;
    this.score[this.player2.id] = 0;
    this.ballCount = gameInfo.ballCount;
    this.type = gameInfo.gameType;
    this.id = gameInfo.id;
    this.ball = new Array(gameInfo.ballCount);
    for (let i = 0; gameInfo.ballCount; i++) {
      this.ball[i] = [
        canvasHeight / 2 + Math.random() * 100,
        canvasWidth / 2 + Math.random() * 30,
        Math.random() * 2 * Math.PI,
      ];
    }
    this.racket[this.player1.id] = [
      0,
      this.canvasHeight / 2 - this.racketHeight / 2,
    ];
    this.racket[this.player2.id] = [
      this.canvasWidth,
      this.canvasHeight / 2 - this.racketHeight / 2,
    ];
    this.ballVelocity = gameInfo.ballSpeed;
  }

  private init() {}

  exportToGameEnetity() {
    const gameEntity = new GameEntity();
    gameEntity.id = this.id;
    const p1 = this.player1.id,
      p2 = this.player2.id;
    gameEntity.gameType = this.type;
    if (!this.isGiveUp) {
      gameEntity.winScore =
        this.score[p1] > this.score[p2] ? this.score[p1] : this.score[p2];
      gameEntity.loseScore =
        this.score[p1] < this.score[p2] ? this.score[p1] : this.score[p2];
      gameEntity.winner =
        this.score[p1] === this.winner ? this.player1 : this.player2;
      gameEntity.loser =
        this.score[p2] === this.loser ? this.player1 : this.player2;
    } else {
      gameEntity.winner = this.giveUpUser === p1 ? this.player2 : this.player1;
      gameEntity.loser = this.giveUpUser === p1 ? this.player1 : this.player2;
      gameEntity.winScore = this.score[gameEntity.winner.id];
      gameEntity.loseScore = this.score[gameEntity.loser.id];
    }
    gameEntity.ballSpeed = this.ballVelocity;
    gameEntity.ballCount = this.ballCount;
    gameEntity.racketSize = this.racketHeight / 2;
    return gameEntity;
  }

  private isInRacket(ball: number[]): boolean {
    let ret = false;
    this.racket.forEach((racket) => {
      if (
        ball[0] >= racket[0] &&
        ball[0] <= racket[0] + this.racketWidth &&
        ball[1] >= racket[1] &&
        ball[1] <= racket[1] + this.racketHeight / 2
      ) {
        ret = true;
      }
    });
    return ret;
  }

  racketUpdate(racketUpdate: any) {
    if (racketUpdate.userId === this.player1.id) {
      this.racket[this.player1.id][1] += racketUpdate.direction;
    } else if (racketUpdate.userId === this.player2.id) {
      this.racket[this.player2.id][1] += racketUpdate.direction;
    }
    if (this.racket[this.])
  }

  ballUpdate() {
    let ret = 0;
    for (let i = 0; i < this.ballCount; i++) {
      this.ball[i][0] += this.ballVelocity * Math.cos(this.ball[i][2]);
      this.ball[i][1] += this.ballVelocity * Math.sin(this.ball[i][2]);
      if (this.ball[i][1] < 0 || this.ball[i][1] > this.canvasHeight) {
        this.ball[i][2] = Math.PI - this.ball[i][2];
      } else if (this.isInRacket(this.ball[i])) {
        this.ball[i][2] = -this.ball[i][2];
      } else if (this.ball[i][0] <= 0) ret = 1;
      else if (this.ball[i][0] >= this.canvasWidth) ret = 2;
      if (ret !== 0) break;
    }
    return ret;
  }
}
