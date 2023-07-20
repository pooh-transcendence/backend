import { PickType } from '@nestjs/swagger';
import { ChannelEntity } from './channel.entity';

export class CreateChannelDto extends PickType(ChannelEntity, [
  'channelType',
  'channelName',
  'password',
] as const) {}

export class UpdateChannelDto {
  userId: number;
  channelId: number;
}
