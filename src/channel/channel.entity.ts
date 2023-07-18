import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity()
export class ChannelEntity extends CommonEntity {
  @Column({ nullable: true })
  channelType: ChannelType;

  @Column({ nullable: true })
  channelName: string;

  @ManyToOne(() => UserEntity, { eager: true })
  owner: UserEntity;

  @Column({ nullable: true })
  password: string;

  @OneToMany(() => ChannelUserEntity, (channelUser) => channelUser.channel, { eager: false })
  channelUser: ChannelUserEntity[];
}