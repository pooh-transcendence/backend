import { PickType } from '@nestjs/swagger';
import { BlockEntity } from './block.entity';

export class CreateBlockDto extends PickType(BlockEntity, [
  'from',
  'to',
] as const) {}

export class RequestBlockDto extends BlockEntity {}
