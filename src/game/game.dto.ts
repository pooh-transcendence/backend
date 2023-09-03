import { PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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
  UP = 1,
  DOWN = -1,
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
  score: number[];
  ball: number[];

  @IsBoolean()
  isGetScore: boolean;
}

export class CreateOneToOneGameDto extends PickType(GameEntity, [
  'ballSpeed',
  'racketSize',
] as const) {
  @IsOptional()
  @IsPositive()
  @IsNumber()
  targetUserId: number;
}

export class OneToOneGameInfoDto extends PickType(GameEntity, [
  'id',
  'gameType',
  'ballSpeed',
  'racketSize',
] as const) {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  userId: number;
}
