import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';
import { CreateGameDto, CreateOneToOneGameDto } from './game.dto';
import { GameEntity } from './game.entity';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { UserService } from 'src/user/user.service';

@Controller('game')
@UseGuards(AuthGuard())
export class GameController {
  constructor(
    private gameService: GameService,
    private userService: UserService,
  ) {}

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

  /* 1VS1 Game */

  /**
   * 홈 화면에서 한 번 호출되는 API
   * 이후의 변경사항은 socket.io(getUpdatedOneToOneGame)를 통해 전달받음
   * @param user
   * @returns GameEntity[]
   */
  @Get('/allOneToOneGame')
  async getAllOneToOneGame(@GetUser() user: UserEntity): Promise<GameEntity[]> {
    return await this.gameService.getAllOneToOneGame(user.id);
  }

  /**
   * 1VS1 게임 매칭 요청 API
   * @param user
   * @param createOneToOneGameDto
   * @returns
   */
  @Post('/oneToOneGame')
  @UsePipes(ValidationPipe)
  async createOneToOneGame(
    @GetUser() user: UserEntity,
    @Body() createOneToOneGameDto: CreateOneToOneGameDto,
  ): Promise<void> {
    const game = await this.gameService.createOneToOneGame(
      user.id,
      createOneToOneGameDto,
    );
    // socket.io를 통해 게임 매칭 요청을 전달
    // privateOneToOneGame의 경우
    if (createOneToOneGameDto.targetNickname) {
      const targetUser = await this.userService.getUserByNickname(
        createOneToOneGameDto.targetNickname,
      );
      if (!targetUser || !targetUser.gameSocketId)
        throw new NotFoundException("Couldn't find target user");
      GameGateway.emitToClient(
        targetUser.gameSocketId,
        'addOneToOneGame',
        game,
      );
    } else {
      // publicOneToOneGame의 경우
      GameGateway.emitToAllClient('addOneToOneGame', game);
    }
  }

  @Delete('/oneToOneGame/:gameId')
  @UsePipes(ValidationPipe)
  async cancelOneToOneGame(
    @GetUser() user: UserEntity,
    @Param('gameId', ParseIntPipe, PositiveIntPipe) gameId: number,
  ): Promise<void> {
    await this.gameService.cancelOneToOneGame(user, gameId);
    GameGateway.emitToAllClient('deleteOneToOneGame', gameId);
  }

  // @Get('/oneToOneGame/:gameId')
  // @UsePipes(ValidationPipe)
  // async startOneToOneGame(
  //   @GetUser() user: UserEntity,
  //   @Param('gameId', ParseIntPipe, PositiveIntPipe) gameId: number,
  // ): Promise<void> {
  //   const game = await this.gameService.startOneToOneGame(user, gameId);
  //   GameGateway.gameReady(game.winner, game.loser, game);
  // }
}
