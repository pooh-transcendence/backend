import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { GameUpdateDto, RacketUpdatesDto } from './game.dto';
import { GameEntity, GameType } from './game.entity';

export enum GameStatus {
  DEFAULT = 'DEFAULT',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export enum PlayerStatus {
  NONE = 0,
  UP = 1,
  DOWN = -1,
}

export class Game {
  private id: number;
  private ballSpeed: number;
  private racketHeight: number;
  private status: GameStatus;
  private ball: number[]; // [x, y, radion]
  private score;
  private winner: UserEntity;
  private loser: UserEntity;
  private type: GameType;
  private isGiveUp: boolean;
  private giveUpUser: number;
  private player1: UserEntity;
  private player2: UserEntity;
  private racket: any; //number[][];
  private playersStatus;

  // paddle 로 바꾸기
  constructor(
    private gameInfo: GameEntity,
    private userService: UserService,

    private readonly canvasWidth = 1400,
    private readonly canvasHeight = 1000,
    private readonly racketWidth = 18,
    private readonly racketSpeed = 10,
    private readonly ballRadius = 10,
    private readonly maxScore = 6,
  ) {
    this.player1 = gameInfo.winner;
    this.player2 = gameInfo.loser;
    this.ballSpeed = gameInfo.ballSpeed;
    this.racketHeight = gameInfo.racketSize;
    this.type = gameInfo.gameType;
    this.id = gameInfo.id;
    this.ballSpeed = gameInfo.ballSpeed;
  }

  init(): GameUpdateDto {
    console.log('init');
    this.ball = [
      this.canvasHeight / 2 + Math.random() * 100, // x
      this.canvasWidth / 2 + Math.random() * 30, // y
      Math.random() * 2 * Math.PI, // radian
    ];

    console.log('this.ball: ', this.ball);
    // console.log('user1: ', this.player1);
    // console.log('user2: ', this.player2);
    console.log('racketHeight: ', this.racketHeight);
    this.racket = {};
    this.racket[this.player1.id] = [
      0, // x
      this.canvasHeight / 2 - this.racketHeight / 2, // y
    ];
    this.racket[this.player2.id] = [
      this.canvasWidth, // x
      this.canvasHeight / 2 - this.racketHeight / 2, // y
    ];

    console.log('this.racket: ', this.racket);
    this.score = {};
    this.score[this.player1.id] = 0;
    this.score[this.player2.id] = 0;

    console.log('this.score: ', this.score);

    this.playersStatus = {};
    this.playersStatus[this.player1.id] = PlayerStatus.NONE;
    this.playersStatus[this.player2.id] = PlayerStatus.NONE;

    console.log('this.racket: ', this.racket);
    const gameUpdateDto: GameUpdateDto = {
      participants: [this.player1.id, this.player2.id],
      gameType: this.type,
      racket: this.racket,
      score: this.score,
      ball: this.ball,
      isGetScore: false,
    };
    console.log('gameUpdateDto: ', gameUpdateDto);
    return gameUpdateDto;
  }

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
    gameEntity.racketSize = this.racketHeight;
    return gameEntity;
  }

  // 원으로 만들고 생각해오기

  private isInRacket(ball: number[]): boolean {
    let ret = false;
    for (const userId in this.racket) {
      if (
        // 원의 중심 기준
        ball[0] - this.ballRadius >= this.racket[userId][0] &&
        ball[0] + this.ballRadius <=
          this.racket[userId][0] + this.racketWidth &&
        ball[1] - this.ballRadius >= this.racket[userId][1] &&
        ball[1] + this.ballRadius <= this.racket[userId][1] + this.racketHeight
      ) {
        ret = true;
      }
    }
    return ret;
  }

  getUpdateRacket(racketUpdate: RacketUpdatesDto) {
    if (racketUpdate.userId === this.player1.id) {
      this.racket[this.player1.id][1] += racketUpdate.direction;
    } else if (racketUpdate.userId === this.player2.id) {
      this.racket[this.player2.id][1] += racketUpdate.direction;
    }
    // userId 예외처리
    if (
      racketUpdate.userId !== this.player1.id &&
      racketUpdate.userId !== this.player2.id
    ) {
      throw new Error('Invalid user');
    }
  }

  racketUpdate() {
    for (const userId in this.playersStatus) {
      this.racket[userId][1] += this.playersStatus[userId];
      if (this.racket[userId][1] < 0) {
        this.racket[userId][1] = 0;
      } else if (
        this.racket[userId][1] >
        this.canvasHeight - this.racketHeight
      ) {
        this.racket[userId][1] = this.canvasHeight - this.racketHeight;
      }
    }
    this.playersStatus[this.player1.id] = PlayerStatus.NONE;
    this.playersStatus[this.player2.id] = PlayerStatus.NONE;
  }

  private ballUpdate(): number {
    let ret: number = 0;
    // 공의 x, y 좌표를 업데이트
    this.ball[0] += this.ballSpeed * Math.cos(this.ball[2]);
    this.ball[1] += this.ballSpeed * Math.sin(this.ball[2]);
    // x축 벽에 부딪힐 때
    if (
      this.ball[1] - this.ballRadius < 0 ||
      this.ball[1] + this.ballRadius > this.canvasHeight
    ) {
      this.ball[2] = -this.ball[2];
    } // racket에 부딪힐 때
    else if (this.isInRacket(this.ball)) {
      this.ball[2] = Math.PI - this.ball[2];
    } // 왼쪽 벽에 부딪힐 때 : player2 승
    else if (this.ball[0] - this.ballRadius <= 0) ret = 2;
    // 오른쪽 벽에 부딪힐 때 : player1 승
    else if (this.ball[0] + this.ballRadius >= this.canvasWidth) ret = 1;
    return ret;
  }

  public update(): GameUpdateDto {
    this.racketUpdate();
    const ret: number = this.ballUpdate();
    const winplayerId = ret === 1 ? this.player1.id : this.player2.id;
    if (ret !== 0) this.score[winplayerId]++;
    // const gameUpdateDto: GameUpdateDto = {
    //   participants: [this.player1.id, this.player2.id],
    //   gameType: this.type,
    //   racket: this.racket,
    //   score: this.score,
    //   ball: this.ball,
    //   isGetScore: ret !== 0,
    // };
    const gameUpdateDto: GameUpdateDto = {
      participants: [this.player1.id, this.player2.id],
      gameType: this.type,
      racket: this.racket,
      score: this.score,
      ball: this.ball,
      isGetScore: ret !== 0,
    };
    return gameUpdateDto;
  }

  getRoomId() {
    return 'game: ' + this.id.toString();
  }

  isGameOver() {
    return (
      this.score[this.player1.id] === this.maxScore ||
      this.score[this.player2.id] === this.maxScore
    );
  }
}
