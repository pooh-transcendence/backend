import { ChannelUserEntity } from './channel-user.entity';
import { IsOptional, IsString, Length } from 'class-validator';
import { PickType } from '@nestjs/swagger';

export class CreateChanneUserDto extends PickType(ChannelUserEntity, [
  'userId',
  'channelId',
] as const) {
  @IsOptional()
  @IsString()
  @Length(1, 12)
  password: string;
}
