import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { Exclude } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity()
export class ChannelEntity extends CommonEntity {
  @Column({ nullable: true })
  @IsIn(['PUBLIC', 'PROTECTED', 'PRIVATE'])
  channelType: ChannelType;

  @Column()
  @IsString()
  @IsNotEmpty()
  channelName: string;

  @ManyToOne(() => UserEntity, { eager: true })
  owner: UserEntity;

  @Column({ nullable: true })
  @Exclude()
  @IsOptional()
  @IsString()
  password: string;

  @OneToMany(() => ChannelUserEntity, (channelUser) => channelUser.channel, {
    eager: false,
  })
  channelUser: ChannelUserEntity[];
}
