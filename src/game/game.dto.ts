import { IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { GameEntity } from './game.entity';

export class CreateGameDto extends GameEntity {
  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  participants: number[];
}
