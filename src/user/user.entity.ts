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
@Unique(['nickName'])
export class UserEntity extends CommonEntity {
  @Column({ nullable: true })
  @IsString()
  ftId: string;

  @Column({ nullable: true })
  @IsString()
  nickName: string;

  @Column({ default: 0 })
  @IsNumber()
  winScore: number;

  @Column({ default: 0 })
  @IsNumber()
  loseScore: number;

  @Column({ nullable: true })
  @IsString()
  avatar: string;

  @Column({ nullable: true })
  @IsEmail()
  email: string;

  @Column({ default: UserState.ONLINE, nullable: true }) // TODO: default 설정
  @IsIn([UserState.OFFLINE, UserState.ONLINE, UserState.INGAME])
  userState: UserState;

  @Column({ nullable: true })
  @IsString()
  token: string;

  @OneToMany(() => GameEntity, (game) => game.winner)
  winnerGame: GameEntity[];

  @OneToMany(() => GameEntity, (game) => game.loser)
  loserGame: GameEntity[];

  @OneToMany(() => ChannelEntity, (channel) => channel.owner)
  ownChannel: ChannelEntity[];

  //@OneToMany(() => ChannelUserEntity, (channelUser)=>channelUser.user)
  //Join :
}
