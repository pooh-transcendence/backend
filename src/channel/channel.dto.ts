import { PickType } from '@nestjs/swagger';
import { ChannelEntity } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';

export class CreateChannelDto extends PickType(ChannelEntity, [
  'channelType',
  'channelName',
  'password',
  'ownerId',
] as const) {}

export class UpdateChannelDto extends PickType(ChannelUserEntity, [
  'userId',
  'channelId',
] as const) {}
