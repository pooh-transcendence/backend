import { Exclude } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsString } from 'class-validator';
import { ChannelEntity } from 'src/channel/channel.entity';
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
  //@IsString()
  @Exclude()
  ftId: string;

  @Column()
  //@IsString()
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
  //@IsString()
  @Exclude()
  token: string;

  @OneToMany(() => GameEntity, (game) => game.winner)
  winnerGame: GameEntity[];

  @OneToMany(() => GameEntity, (game) => game.loser)
  loserGame: GameEntity[];

  @Column({ nullable: true })
  @Exclude()
  accessToken: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;
  //@OneToMany(() => ChannelUserEntity, (channelUser)=>channelUser.user)
  //Join :
}
