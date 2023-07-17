import { IsNotEmpty, IsNumber, IsPositive, isNotEmpty } from "class-validator";
import { GameType, MatchEntity } from "./match.entity";

export class CreateMatchDto extends MatchEntity{}