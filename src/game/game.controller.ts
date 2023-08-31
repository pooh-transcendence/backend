import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decostor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';
import { CreateGameDto } from './game.dto';
import { GameEntity } from './game.entity';
import { GameService } from './game.service';

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
  ): Promise<GameEntity> {
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

  @Get('/allWaitingGame')
  async getAllWaitingGame(@GetUser() user: UserEntity): Promise<GameEntity[]> {
    return await this.gameService.getAllWaitingGame();
  }
}
