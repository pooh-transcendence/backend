import { IsIn, IsNumber, IsPositive } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum GameType {
  ONEVSONE_PRIVATE = '1vs1 PRIVATE',
  ONEVSONE_PUBLIC = '1vs1 PUBLIC',
  LADDER = 'LADDER',
}

export enum GameStatus {
  DEFAULT = 'DEFAULT',
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

@Entity()
export class GameEntity extends CommonEntity {
  @ManyToOne(() => UserEntity, (user) => user.winnerGame, { eager: false })
  winner: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.loserGame, { eager: false })
  loser: UserEntity;

  @Column()
  @IsIn([GameType.LADDER, GameType.ONEVSONE_PRIVATE, GameType.ONEVSONE_PUBLIC])
  gameType: GameType;

  @Column({ default: 0 })
  @IsNumber()
  winScore: number;

  @Column({ default: 0 })
  @IsNumber()
  loseScore: number;

  @Column({ default: 2 })
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3])
  ballSpeed: number;

  @Column({ default: 2 })
  @IsNumber()
  @IsPositive()
  @IsIn([1, 2, 3])
  racketSize: number;

  @Column({ default: GameStatus.DEFAULT })
  @IsIn([
    GameStatus.DEFAULT,
    GameStatus.WAITING,
    GameStatus.PLAYING,
    GameStatus.FINISHED,
  ])
  gameStatus: string;
  // @Column({ default: null })
  // isGiveUp: boolean;

  // @Column({ default: null })
  // @IsNumber()
  // giveUpUser: number;
}
