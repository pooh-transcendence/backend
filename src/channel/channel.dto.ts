import { PickType } from '@nestjs/swagger';
import { ChannelEntity } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateChannelDto extends PickType(ChannelEntity, [
  'channelType',
  'channelName',
  'password',
  'ownerId',
] as const) {}

export class UpdateChannelDto extends PickType(ChannelEntity, [
  'password',
] as const) {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  'channelId': number;
}

export class UpdateChannelUserDto extends PickType(ChannelUserEntity, [
  'userId',
  'channelId',
] as const) {}
