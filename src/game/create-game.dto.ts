import { IsNotEmpty, IsNumber, IsPositive, isNotEmpty } from "class-validator";
import { GameType, GameEntity } from "./game.entity";

export class CreateGameDto extends GameEntity{}