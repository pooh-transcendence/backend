import { Injectable, NotFoundException } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { CreateGameDto } from './game.dto';
import { GameEntity, GameType } from './game.entity';
import { UserRepository } from 'src/user/user.repository';
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
}

export enum GameStatus {
  DEFAULT = 'DEFAULT',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

class Game {
  private id: number;
  private ballSpeed: number;
  private racketHeight: number;
  private status: GameStatus;
  private ball; // [x, y, radion]
  private score;
  private winner: UserEntity;
  private loser: UserEntity;
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
    private readonly racketWidth = 30,
    private readonly racketSpeed = 10,
    private readonly ballRadius = 10,
    private readonly maxScore = 6,
  ) {
    this.player1 = gameInfo.winner;
    this.player2 = gameInfo.loser;
    this.ballSpeed = gameInfo.ballSpeed;
    this.racketHeight = gameInfo.racketSize;
    this.score[this.player1.id] = 0;
    this.score[this.player2.id] = 0;
    this.ballCount = gameInfo.ballCount;
    this.type = gameInfo.gameType;
    this.id = gameInfo.id;
    this.ball = new Array(gameInfo.ballCount);
    for (let i = 0; gameInfo.ballCount; i++) {
      this.ball[i] = [
        canvasHeight / 2 + Math.random() * 100, // x
        canvasWidth / 2 + Math.random() * 30, // y
        Math.random() * 2 * Math.PI, // radian
      ];
    }
    this.racket[this.player1.id] = [
      0, // x
      this.canvasHeight / 2 - this.racketHeight / 2, // y
    ];
    this.racket[this.player2.id] = [
      this.canvasWidth, // x
      this.canvasHeight / 2 - this.racketHeight / 2, // y
    ];
    this.ballSpeed = gameInfo.ballSpeed;
  }

  private init() {}

  exportToGameEntity() {
    const gameEntity = new GameEntity();
    gameEntity.id = this.id;
    const p1 = this.player1.id,
      p2 = this.player2.id;
    gameEntity.gameType = this.type;
    if (!this.isGiveUp) {
      this.winner =
        this.score[p1] > this.score[p2] ? this.player1 : this.player2;
      this.loser =
        this.score[p1] > this.score[p2] ? this.player2 : this.player1;
    } else {
      this.winner = this.giveUpUser === p1 ? this.player2 : this.player1;
      this.loser = this.giveUpUser === p1 ? this.player1 : this.player2;
    }
    gameEntity.winner = this.winner;
    gameEntity.loser = this.loser;
    gameEntity.winScore = this.score[this.winner.id];
    gameEntity.loseScore = this.score[this.loser.id];
    gameEntity.ballSpeed = this.ballSpeed;
    gameEntity.ballCount = this.ballCount;
    gameEntity.racketSize = this.racketHeight;
    return gameEntity;
  }

  private isInRacket(ball: number[]): boolean {
    let ret = false;
    this.racket.forEach((racket) => {
      if (
        // 원의 중심 기준
        ball[0] - this.ballRadius >= racket[0] &&
        ball[0] + this.ballRadius <= racket[0] + this.racketWidth &&
        ball[1] - this.ballRadius >= racket[1] &&
        ball[1] + this.ballRadius <= racket[1] + this.racketHeight / 2
      ) {
        ret = true;
      }
    });
    return ret;
  }

  racketUpdate(racketUpdate: any) {
    // if (racketUpdate.userId === this.player1.id) {
    //   this.racket[this.player1.id][1] += racketUpdate.direction;
    // } else if (racketUpdate.userId === this.player2.id) {
    //   this.racket[this.player2.id][1] += racketUpdate.direction;
    // }
    // // userId 예외처리
    // if (
    //   racketUpdate.userId !== this.player1.id &&
    //   racketUpdate.userId !== this.player2.id
    // ) {
    //   throw new Error('Invalid user');
    // }
    this.racket[racketUpdate.userId][1] += racketUpdate.direction;
    // canvas height check
    if (this.racket[racketUpdate.userId][1] < 0) {
      this.racket[racketUpdate.userId][1] = 0;
    } else if (
      this.racket[racketUpdate.userId][1] >
      this.canvasHeight - this.racketHeight
    ) {
      this.racket[racketUpdate.userId][1] =
        this.canvasHeight - this.racketHeight;
    }
  }

  ballUpdate(): number {
    let ret = 0;
    for (let i = 0; i < this.ballCount; i++) {
      this.ball[i][0] += this.ballSpeed * Math.cos(this.ball[i][2]);
      this.ball[i][1] += this.ballSpeed * Math.sin(this.ball[i][2]);
      if (
        this.ball[i][1] - this.ballRadius < 0 ||
        this.ball[i][1] + this.ballRadius > this.canvasHeight
      ) {
        // x축 벽에 부딪힐 때
        this.ball[i][2] = -this.ball[i][2];
      } else if (this.isInRacket(this.ball[i])) {
        // racket에 부딪힐 때
        this.ball[i][2] = Math.PI - this.ball[i][2];
      } else if (this.ball[i][0] - this.ballRadius <= 0)
        ret = 2; // 왼쪽 벽에 부딪힐 때 : player2 승
      else if (this.ball[i][0] + this.ballRadius >= this.canvasWidth) ret = 1; // 오른쪽 벽에 부딪힐 때 : player1 승
      if (ret !== 0) break;
    }
    return ret;
  }
}
