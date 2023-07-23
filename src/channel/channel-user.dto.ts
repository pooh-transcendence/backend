import { Optional } from '@nestjs/common';
import { ChannelUserEntity } from './channel-user.entity';

export class CreateChanneUserDto extends ChannelUserEntity {
  @Optional()
  password: string;
}
