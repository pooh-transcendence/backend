import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './create-game.dto';
import { GameEntity } from './game.entity';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('/game')
  async createGame(@Body() createGameDto: CreateGameDto): Promise<GameEntity> {
    return await this.gameService.createGame(createGameDto);
  }

  @Get('/game')
  async getAllGame(): Promise<GameEntity[]> {
    return await this.gameService.getAllGame();
  }

  @Get('/game/:gameId') // validate
  async getGameByGameId(@Param('gameId') gameId: number): Promise<GameEntity> {
    return await this.gameService.getGameByGameId(gameId);
  }

  @Get('/game/:userId')
  async getGameByUserId(
    @Param('userId') userId: number,
  ): Promise<GameEntity[]> {
    return await this.gameService.getGameByUserId(userId);
  }

  @Delete('game/:gameId')
  async getDeleteByGameId(@Param('gameId') gameId: number) {
    this.gameService.deleteGameByGameId(gameId);
  }
}
