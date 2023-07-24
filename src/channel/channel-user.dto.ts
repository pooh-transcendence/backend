import { Optional } from '@nestjs/common';
import { ChannelUserEntity } from './channel-user.entity';
import { Exclude } from 'class-transformer';
import { Length } from 'class-validator';

export class CreateChanneUserDto extends ChannelUserEntity {
  @Optional()
  // @Exclude()
  @Length(1, 12)
  password: string;
}
