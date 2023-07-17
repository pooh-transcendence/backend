import { IsNotEmpty, isNumber } from 'class-validator';

export class CreateBlockDto {
  from: number;

  to: number;
}
