import { IsIn, IsNumber, isNumber } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum GameType {
  ONEVSONE = '1vs1',
  LADDER = 'LADDER',
}

@Entity()
export class GameEntity extends CommonEntity {
  @ManyToOne(() => UserEntity, (user) => user.winnerGame, { eager: false })
  winner: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.loserGame, { eager: false })
  loser: UserEntity;

  @Column()
  @IsIn([GameType.ONEVSONE, GameType.LADDER])
  gameType: GameType;

  @Column({ default: 0 })
  @IsNumber()
  winScore: number;

  @Column({ default: 0 })
  @IsNumber()
  loseScore: number;

  @Column({ default: 1 })
  @IsNumber()
  ballSpeed: number;

  @Column({ default: 1 })
  @IsNumber()
  ballCount: number;

  @Column({ default: 1 })
  @IsNumber()
  racketSize: number;

  @Column({ default: null })
  isGiveUp: boolean;

  @Column({ default: null })
  @IsNumber()
  giveUpUser: number;
}
