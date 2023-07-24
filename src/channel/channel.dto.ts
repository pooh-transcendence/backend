import { PickType } from '@nestjs/swagger';
import { ChannelEntity } from './channel.entity';
import { IsNotEmpty, IsPositive } from 'class-validator';

export class CreateChannelDto extends PickType(ChannelEntity, [
  'channelType',
  'channelName',
  'password',
] as const) {
  @IsNotEmpty()
  @IsPositive()
  ownerId: number;
}

export class UpdateChannelDto {
  userId: number;
  channelId: number;
}
