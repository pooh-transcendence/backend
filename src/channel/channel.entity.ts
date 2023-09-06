import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';
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

  @Column()
  @IsNumber()
  @IsPositive()
  ownerId: number;

  @Column({ nullable: true })
  // @Exclude()
  @IsOptional()
  @IsString()
  @Length(1, 12)
  password: string;

  userCount: number;
}
