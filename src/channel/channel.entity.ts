import { CommonEntity } from 'src/common/common.entity';
import { UserEntity } from 'src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { Exclude } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PROTECTED = 'PROTECTED',
  PRIVATE = 'PRIVATE',
}

@Entity()
export class ChannelEntity extends CommonEntity {
  @Column({ nullable: true })
  @IsIn([ChannelType.PUBLIC, ChannelType.PROTECTED, ChannelType.PRIVATE])
  channelType: ChannelType;

  @Column()
  @IsString()
  @IsNotEmpty()
  channelName: string;

  //  @ManyToOne(() => UserEntity, { eager: true })
  // owner: UserEntity;
  @Column()
  @IsNumber()
  @IsPositive()
  ownerId: number;

  @Column({ nullable: true })
  @Exclude()
  @IsOptional()
  @IsString()
  @Length(1, 12)
  password: string;

  /*@OneToMany(() => ChannelUserEntity, (channelUser) => channelUser.channel, {
    eager: false,
  })
  channelUser: ChannelUserEntity[];*/
}
