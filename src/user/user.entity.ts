import { Exclude } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsString, Length } from 'class-validator';
import { BlockEntity } from 'src/block/block.entity';
import { ChannelEntity } from 'src/channel/channel.entity';
import { CommonEntity } from 'src/common/common.entity';
import { FriendEntity } from 'src/friend/friend.entity';
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
  @Length(2, 10)
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

  @Column({ default: UserState.OFFLINE, nullable: true })
  @IsIn([UserState.OFFLINE, UserState.ONLINE, UserState.INGAME])
  userState: UserState;

  @Column({ nullable: true })
  @IsString()
  token: string;

  @OneToMany(() => GameEntity, (game) => game.winner)
  winnerGame: GameEntity[];

  @OneToMany(() => GameEntity, (game) => game.loser)
  loserGame: GameEntity[];

  @Column({ nullable: true })
  @IsString()
  accessToken!: string | null;

  @Column({ nullable: true })
  @IsString()
  refreshToken!: string | null;

  @Column({ nullable: true })
  @Exclude()
  secret: string;

  @Column({ nullable: true })
  @Exclude()
  channelSocketId: string;

  @Column({ nullable: true })
  @Exclude()
  gameSocketId: string;
}

export class UserType extends UserEntity {
  channels: ChannelEntity[];
  friends: UserEntity[];
  blocks: UserEntity[];
}
