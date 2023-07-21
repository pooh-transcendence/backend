import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './game.dto';
import { GameEntity } from './game.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  private logger = new Logger(GameController.name);

  @Get()
  async getAllGame(): Promise<GameEntity[]> {
    return await this.gameService.getAllGame();
  }

  @Post()
  @UsePipes(ValidationPipe)
  async createGame(@Body() createGameDto: CreateGameDto): Promise<GameEntity> {
    return await this.gameService.createGame(createGameDto);
  }

  @Get('/:gameId')
  @UsePipes(ValidationPipe)
  async getGameByGameId(
    @Param('gameId', ParseIntPipe, PositiveIntPipe) gameId: number,
  ): Promise<GameEntity[]> {
    return await this.gameService.getGameByGameId(gameId);
  }

  @Get('/user/:userId')
  @UsePipes(ValidationPipe)
  async getGameByUserId(
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ): Promise<GameEntity[]> {
    return await this.gameService.getGameByUserId(userId);
  }

  @Delete('/:gameId')
  async getDeleteByGameId(
    @Param('gameId', ParseIntPipe, PositiveIntPipe) gameId: number,
  ) {
    this.gameService.deleteGameByGameId(gameId);
  }
}
