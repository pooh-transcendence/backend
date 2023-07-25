import { IsEmail, IsIn, IsNumber, IsString } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { GameEntity } from 'src/game/game.entity';
import { Column, Entity, OneToMany, Unique } from 'typeorm';

export enum UserState {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  INGAME = 'INGAME',
}

@Entity()
@Unique(['nickname'])
export class UserEntity extends CommonEntity {
  @Column()
  @IsString()
  // @Exclude()
  ftId: string;

  @Column()
  @IsString()
  nickname: string;

  @Column({ default: 0 })
  @IsNumber()
  winScore: number;

  @Column({ default: 0 })
  @IsNumber()
  loseScore: number;

  @Column({ nullable: true })
  @IsString()
  avatar: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ default: UserState.ONLINE, nullable: true })
  @IsIn([UserState.OFFLINE, UserState.ONLINE, UserState.INGAME])
  userState: UserState;

  @Column({ nullable: true })
  @IsString()
  // @Exclude()
  token: string;

  @OneToMany(() => GameEntity, (game) => game.winner, { eager: true })
  winnerGame: GameEntity[];

  @OneToMany(() => GameEntity, (game) => game.loser, { eager: true })
  loserGame: GameEntity[];

  @Column({ nullable: true })
  // @Exclude()
  @IsString()
  accessToken: string;

  @Column({ nullable: true })
  // @Exclude()
  @IsString()
  refreshToken: string;
  //@OneToMany(() => ChannelUserEntity, (channelUser)=>channelUser.user)
  //Join :
}
