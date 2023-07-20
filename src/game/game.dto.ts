import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { GameEntity } from './game.entity';

export class CreateGameDto extends GameEntity {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  participants: number[];
}
