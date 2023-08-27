import { PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { GameEntity } from './game.entity';

export class CreateGameDto extends PickType(GameEntity, [
  'gameType',
  'ballSpeed',
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

export class GameUpdateDto extends PickType(GameEntity, ['gameType']) {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  participants: number[];

  racket: number[][];
  score: number[][];
  ball: number[];

  @IsBoolean()
  isGetScore: boolean;
}
