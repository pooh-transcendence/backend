import { PickType } from '@nestjs/swagger';
import { FriendEntity } from './friend.entity';

export class FriendDto extends PickType(FriendEntity, [
  'from',
  'to',
] as const) {}
