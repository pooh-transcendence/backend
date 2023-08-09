import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { GameEntity } from './game.entity';
import { PickType } from '@nestjs/swagger';

export class CreateGameDto extends PickType(GameEntity, [
  'gameType',
  'ballSpeed',
  'ballCount',
  'winner',
  'loser',
] as const) {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  participants: number[];
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
}

export class RacketUpdatesDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNotEmpty()
  @IsIn([Direction.UP, Direction.DOWN])
  direction: Direction;
}
