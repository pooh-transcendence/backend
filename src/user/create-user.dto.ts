import { PickType } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

export class CreateUserDto extends PickType(UserEntity, [
  'nickName',
  'email',
  'ftId',
  'token',
] as const) {}
