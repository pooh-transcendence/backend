import { Optional } from '@nestjs/common';
import { ChannelUserEntity } from './channel-user.entity';
import { Exclude } from 'class-transformer';

export class CreateChanneUserDto extends ChannelUserEntity {
  @Optional()
  @Exclude()
  password: string;
}
