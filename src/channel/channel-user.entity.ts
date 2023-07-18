import { CommonEntity } from 'src/common/common.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ChannelEntity } from './channel.entity';
import { channel } from 'diagnostics_channel';
import { UserEntity } from 'src/user/user.entity';
import { userInfo } from 'os';

@Entity()
export class ChannelUserEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @ManyToOne(() => ChannelEntity, (channel) => channel.channelUser, { eager: true })
  channel: ChannelEntity;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBanned: boolean;
}
