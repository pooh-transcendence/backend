import { IsNotEmpty, isNumber } from 'class-validator';
import { BlockEntity } from './block.entity';

export class CreateBlockDto extends BlockEntity {}
