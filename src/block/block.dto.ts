import { PickType } from '@nestjs/swagger';
import { BlockEntity } from './block.entity';

export class BlockDto extends PickType(BlockEntity, ['from', 'to'] as const) {}
