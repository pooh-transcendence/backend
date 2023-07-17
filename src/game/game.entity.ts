import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  gameType: GameType;

  @Column({ default: 0 })
  winScore: number;

  @Column({ default: 0 })
  loseScore: number;

  @Column({ default: 1 })
  ballSpeed: number;

  @Column({ default: 1 })
  ballCount: number;

  @Column({ default: 1 })
  racketSize: number;
}
