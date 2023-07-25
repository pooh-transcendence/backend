import { Optional } from '@nestjs/common';
import { ChannelUserEntity } from './channel-user.entity';
import { IsString, Length } from 'class-validator';
import { PickType } from '@nestjs/swagger';

export class CreateChanneUserDto extends PickType(ChannelUserEntity, [
  'userId',
  'channelId',
] as const) {
  @Optional()
  @IsString()
  @Length(1, 12)
  password: string;
}
