import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './game.dto';
import { GameEntity } from './game.entity';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post()
  async createGame(@Body() createGameDto: CreateGameDto): Promise<GameEntity> {
    return await this.gameService.createGame(createGameDto);
  }

  @Get()
  async getAllGame(): Promise<GameEntity[]> {
    return await this.gameService.getAllGame();
  }

  @Get('/:gameId') // validate
  async getGameByGameId(
    @Param('gameId') gameId: number,
  ): Promise<GameEntity[]> {
    return await this.gameService.getGameByGameId(gameId);
  }

  @Get('/user/:userId')
  async getGameByUserId(
    @Param('userId') userId: number,
  ): Promise<GameEntity[]> {
    return await this.gameService.getGameByUserId(userId);
  }

  @Delete('/:gameId')
  async getDeleteByGameId(@Param('gameId') gameId: number) {
    this.gameService.deleteGameByGameId(gameId);
  }
}
