import { PickType } from '@nestjs/swagger';
import { FriendEntity } from './friend.entity';
import { UserEntity } from './user.entity';

export class CreateUserDto extends PickType(UserEntity, [
  'nickName',
  'email',
  'ftId',
  'token',
] as const) {}

export class CreateFriendDto {
  from: number;
  to: number;
}
export class FriendDto extends FriendEntity {}
