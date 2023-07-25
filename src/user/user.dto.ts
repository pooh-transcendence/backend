import { PickType } from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { IsBoolean } from 'class-validator';

export class CreateUserDto extends PickType(UserEntity, [
  'nickname',
  'email',
  'ftId',
  'token',
] as const) {}

export class UserProfileDto extends PickType(UserEntity, [
  'id',
  'nickname',
  'avatar',
  'winScore',
  'loseScore',
  'userState',
  'winnerGame',
  'loserGame',
] as const) {
  @IsBoolean()
  isFriend: boolean;

  @IsBoolean()
  isBlocked: boolean;
}
