import { PickType } from '@nestjs/swagger';
import { FriendEntity } from './friend.entity';
import { UserEntity } from './user.entity';

export class CreateUserDto extends PickType(UserEntity, [
  'nickname',
  'email',
  'ftId',
  'token',
] as const) {}

export class CreateFriendDto extends FriendEntity {}
