import { IsNotEmpty, IsNumber, IsPositive, isNotEmpty } from "class-validator";
import { GameType } from "./match.entity";

export class CreateMatchDto {
    @IsNotEmpty()
    winner: number;

    @IsNotEmpty()
    loser: number;

    @IsNotEmpty()
    gameType: GameType;

    ballSpeed: number;

    ballCount: number;

    racketSize: number;
}