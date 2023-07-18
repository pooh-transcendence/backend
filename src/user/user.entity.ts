import { ChannelUserEntity } from 'src/channel/channel-user.entity';
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
  ftId: string;

  @Column({ nullable: true })
  nickName: string;

  @Column({ default: 0 })
  winScore: number;

  @Column({ default: 0 })
  loseScore: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: UserState.ONLINE, nullable: true })
  userState: UserState;

  @Column({ nullable: true })
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
