import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decostor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';
import { CreateGameDto, CreateOneToOneGameDto } from './game.dto';
import { GameEntity } from './game.entity';
import { GameService } from './game.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('game')
@UseGuards(AuthGuard())
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
    return await this.gameService.getAllWaitingGame(user.id);
  }

  @Post('/oneToOneGame')
  @UsePipes(ValidationPipe)
  async createOneToOneGame(
    @GetUser() user: UserEntity,
    @Body() createOneToOneGameDto: CreateOneToOneGameDto,
  ): Promise<void> {
    return await this.gameService.createOneToOneGame(
      user.id,
      createOneToOneGameDto,
    );
  }

  @Get('/oneToOneGame/:gameId')
  @UsePipes(ValidationPipe)
  async startOneToOneGame(
    @GetUser() user: UserEntity,
    @Param('gameId', ParseIntPipe, PositiveIntPipe) gameId: number,
  ): Promise<GameEntity> {
    return await this.gameService.startOneToOneGame(user, gameId);
  }
}
