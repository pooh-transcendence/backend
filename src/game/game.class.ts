import { UserEntity } from 'src/user/user.entity';
import { GameUpdateDto, RacketUpdatesDto } from './game.dto';
import { GameEntity, GameStatus, GameType } from './game.entity';
import { UserService } from 'src/user/user.service';

export enum PlayerStatus {
  NONE = 0,
  UP = 1,
  DOWN = -1,
}

export class Game {
  private id: number;
  private ballSpeed: number;
  private originBallSpeed: number;
  private status: GameStatus;
  private ball: number[]; // [x, y, radion]
  private score: number[];
  private winner: UserEntity;
  private loser: UserEntity;
  private type: GameType;
  private isGiveUp: boolean;
  private giveUpUser: number;
  private player1: UserEntity;
  private player2: UserEntity;
  private racket: number[][];
  private playersStatus: number[];
  private gameOver: boolean;
  private readyCountPlayer: number;
  private loopOver: boolean;
  private gameUpdateDto: GameUpdateDto;
  // paddle 로 바꾸기
  constructor(
    private gameInfo: GameEntity,
    private userService: UserService,

    private readonly canvasWidth = 1400,
    private readonly canvasHeight = 1000,
    private readonly racketWidth = 18,
    private readonly racketHeight = 180,
    private readonly racketSpeed = 10,
    private readonly ballRadius = 9,
    private readonly maxScore = 6,
    private readonly ballVelocity = 2,
  ) {
    this.player1 = gameInfo.winner;
    this.player2 = gameInfo.loser;
    this.type = gameInfo.gameType;
    this.id = gameInfo.id;
    this.originBallSpeed = gameInfo.ballSpeed * 2; // 2, 4, 6
    this.ballSpeed = this.originBallSpeed;
    this.gameOver = false;
    this.readyCountPlayer = 0;
    this.racketHeight = gameInfo.racketSize * 90;
    this.loopOver = false;
  }

  init(isUpdate: boolean): GameUpdateDto {
    this.ballSpeed = this.originBallSpeed;

    //console.log('this.racket: ', this.racket);
    if (!isUpdate) {
      this.score = new Array(2);
      this.score[0] = 0;
      this.score[1] = 0;

      this.racket = new Array(2);
      this.racket[0] = [
        150, // x
        this.canvasHeight / 2 - this.racketHeight / 2, // y
      ];
      //player2 init
      this.racket[1] = [
        1250,
        // this.canvasWidth - 200, // x
        this.canvasHeight / 2 - this.racketHeight / 2, // y
      ];

      this.playersStatus = new Array(2);
    }
    //console.log('this.score: ', this.score);
    this.ball = [
      this.canvasWidth / 2, // x
      this.canvasHeight / 2 + Math.random() * 30, // y
      (Math.random() * (1 / 3) - 1 / 6) * Math.PI,
    ];
    if ((this.score[0] + this.score[1]) % 2 === 0)
      this.ball[2] = Math.PI - this.ball[2];

    this.playersStatus[0] = PlayerStatus.NONE;
    this.playersStatus[1] = PlayerStatus.NONE;

    //console.log('this.playersStatus: ', this.playersStatus);
    const gameUpdateDto: GameUpdateDto = {
      participants: [this.player1.id, this.player2.id],
      gameType: this.type,
      racket: this.racket,
      score: this.score,
      ball: this.ball,
      isGetScore: false,
    };
    this.gameUpdateDto = gameUpdateDto;
    //console.log('gameUpdateDto: ', gameUpdateDto);
    return gameUpdateDto;
  }

  getGameUpdateDto(): GameUpdateDto {
    return this.gameUpdateDto;
  }

  exportToGameEntity() {
    const gameEntity = new GameEntity();
    gameEntity.id = this.id;
    gameEntity.gameType = this.type;

    if (!this.isGiveUp) {
      this.winner = this.score[0] > this.score[1] ? this.player1 : this.player2;
      this.loser = this.score[0] > this.score[1] ? this.player2 : this.player1;
    } else {
      this.winner =
        this.giveUpUser === this.player1.id ? this.player2 : this.player1;
      this.loser =
        this.giveUpUser === this.player1.id ? this.player1 : this.player2;
    }
    gameEntity.winner = this.winner;
    gameEntity.loser = this.loser;
    gameEntity.winScore = Math.max(this.score[0], this.score[1]);
    gameEntity.loseScore = Math.min(this.score[0], this.score[1]);
    gameEntity.ballSpeed = this.originBallSpeed / 2; //
    return gameEntity;
  }

  private ballInRacket(ball: number[]): boolean {
    let ret: boolean = false;
    this.racket.forEach((racket) => {
      const distX = Math.abs(ball[0] - racket[0] - this.racketWidth / 2);
      const distY = Math.abs(ball[1] - racket[1] - this.racketHeight / 2);
      if (
        distX < this.racketWidth / 2 + this.ballRadius &&
        distY < this.racketHeight / 2 + this.ballRadius
      ) {
        ret = true;
        this.ballSpeed *= 1.2;
      }
    });
    return ret;
  }

  private isInRacket(ball: number[]): boolean {
    // user1(left) racket check
    let racketX = this.racket[0][0];
    let racketY = this.racket[0][1];
    if (
      ball[0] - this.ballRadius <= racketX + this.racketWidth &&
      ball[0] - this.ballRadius >= racketX &&
      ball[1] - this.ballRadius >= racketY &&
      ball[1] + this.ballRadius <= racketY + this.racketHeight
    )
      return true;
    // user2(right) racket check
    racketX = this.racket[1][0];
    racketY = this.racket[1][1];
    if (
      ball[0] + this.ballRadius >= racketX &&
      ball[0] + this.ballRadius <= racketX + this.racketWidth &&
      ball[1] - this.ballRadius >= racketY &&
      ball[1] - this.ballRadius <= racketY + this.racketHeight
    )
      return true;
    // 라켓에 공이 맞지 않으면 false
    return false;
  }

  getUpdateRacket(racketUpdate: RacketUpdatesDto) {
    if (racketUpdate.userId === this.player1.id) {
      this.playersStatus[0] = racketUpdate.direction;
    } else if (racketUpdate.userId === this.player2.id) {
      this.playersStatus[1] = racketUpdate.direction;
    }
    // userId 예외처리
    if (
      racketUpdate.userId !== this.player1.id &&
      racketUpdate.userId !== this.player2.id
    ) {
      throw new Error('Invalid user');
    }
  }

  tmpGetUpdateRacket(racketUpdate: RacketUpdatesDto) {
    if (racketUpdate.userId === this.player1.id)
      this.playersStatus[0] = racketUpdate.direction;
    if (racketUpdate.userId === this.player2.id)
      this.playersStatus[1] = racketUpdate.direction;
    // userId 예외처리
    if (
      racketUpdate.userId !== this.player1.id &&
      racketUpdate.userId !== this.player2.id
    ) {
      throw new Error('Invalid user');
    }
  }

  racketUpdate() {
    this.racket.forEach((racket, userId) => {
      this.racket[userId][1] -= this.playersStatus[userId] * 50;
      if (this.racket[userId][1] < 0) {
        this.racket[userId][1] = 0;
      } else if (
        this.racket[userId][1] + this.racketHeight >=
        this.canvasHeight
      ) {
        this.racket[userId][1] = this.canvasHeight - this.racketHeight;
      }
    });
    this.playersStatus[0] = PlayerStatus.NONE;
    this.playersStatus[1] = PlayerStatus.NONE;
  }

  private ballUpdate(): number {
    let ret: number = 0;
    // 공의 x, y 좌표를 업데이트
    this.ball[0] += this.ballSpeed * Math.cos(this.ball[2]) * this.ballVelocity;
    this.ball[1] += this.ballSpeed * Math.sin(this.ball[2]) * this.ballVelocity;
    // x축 벽에 부딪힐 때
    if (
      this.ball[1] - this.ballRadius < 0 ||
      this.ball[1] + this.ballRadius > this.canvasHeight
    ) {
      this.ball[2] = -this.ball[2];
    } // racket에 부딪힐 때
    else if (this.ballInRacket(this.ball)) {
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
    let winplayerId = 0;
    if (ret === 1) winplayerId = 0;
    else if (ret === 2) winplayerId = 1;
    if (ret !== 0) this.score[winplayerId]++;
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

  setGameOver(gameOver: boolean) {
    this.gameOver = gameOver;
  }

  isGameOver() {
    return (
      this.gameOver ||
      this.score[0] === this.maxScore ||
      this.score[1] === this.maxScore
    );
  }

  getGiveUp(isConnect: boolean[]) {
    if (this.isGiveUp) return true;
    this.isGiveUp = Math.max(this.score[0], this.score[1]) !== this.maxScore;
    if (this.isGiveUp)
      this.giveUpUser = !isConnect[0] ? this.player1.id : this.player2.id;
    return this.isGiveUp;
  }

  getPlayer1(): UserEntity {
    return this.player1;
  }
  getPlayer2(): UserEntity {
    return this.player2;
  }

  readyCount(): boolean {
    this.readyCountPlayer++;
    return this.readyCountPlayer !== 2;
  }

  getType(): GameType {
    return this.type;
  }

  setLoop(loopOver: boolean) {
    this.loopOver = loopOver;
  }

  isLoop(): boolean {
    return this.loopOver;
  }
}
