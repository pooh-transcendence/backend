import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import {
  CreateGameDto,
  CreateOneToOneGameDto,
  OneToOneGameInfoDto,
} from './game.dto';
import { GameEntity, GameStatus, GameType } from './game.entity';
import { GameRepository } from './game.repository';
import { isIn } from 'class-validator';
import { ConnectionTimeoutError } from 'redis';

@Injectable()
export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private userRepository: UserRepository,
    private userService: UserService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
    const [id1, id2] = createGameDto.participants;
    console.log('id1: ', id1, 'id2: ', id2);
    const user1 = await this.userRepository.getUserByUserId(id1);
    const user2 = await this.userRepository.getUserByUserId(id2);
    if (!user1 || !user2) throw new NotFoundException("Couldn't find users");
    createGameDto.winner = user1;
    createGameDto.loser = user2;
    return await this.gameRepository.createGame(createGameDto);
  }

  async getAllGame(): Promise<GameEntity[]> {
    return await this.gameRepository.getAllGame();
  }

  async getGameByUserId(userId: number): Promise<GameEntity[]> {
    return await this.gameRepository.getGameByUserId(userId);
  }

  async getGameByGameId(gameId: number): Promise<GameEntity> {
    return await this.gameRepository.getGameByGameId(gameId);
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    await this.gameRepository.deleteGameByGameId(gameId);
  }

  async updateGame(game: GameEntity): Promise<void> {
    await this.gameRepository.updateGame(game);
  }

  async getAllOneToOneGame(userId: number): Promise<OneToOneGameInfoDto[]> {
    const publicGames = await this.gameRepository.getAllPublicWaitingGame();
    const privateGames = await this.gameRepository.getAllPrivateWaitingGame(
      userId,
    );
    const games = [...publicGames, ...privateGames];
    return games.map((game) => this.mapGameEntityToOneToOneGameInfoDto(game));
  }

  async createOneToOneGame(
    user: UserEntity,
    createOneToOneGameDto: CreateOneToOneGameDto,
  ): Promise<OneToOneGameInfoDto> {
    if (
      await this.canMakeOneToOneGame(
        user.id,
        createOneToOneGameDto.targetUserId,
      )
    )
      throw new BadRequestException('You are already in a game');
    const game = new GameEntity();
    if (createOneToOneGameDto.targetUserId) {
      // console.log('PRIVATE targetUserId: ', createOneToOneGameDto.targetUserId);
      if (createOneToOneGameDto.targetUserId === user.id)
        throw new NotFoundException("Target user can't be same as user");
      // console.log('targetNickname: ', createOneToOneGameDto.targetNickname);
      const targetUser = await this.userRepository.getUserByUserId(
        createOneToOneGameDto.targetUserId,
      );
      if (!targetUser || !targetUser.gameSocketId)
        throw new NotFoundException("Couldn't find target user");
      // private 1vs1 game
      game.gameType = GameType.ONEVSONE_PRIVATE;
      game.loser = targetUser;
    } else {
      // public 1vs1 game
      game.gameType = GameType.ONEVSONE_PUBLIC;
      game.loser = null;
    }

    game.winner = user;
    game.winScore = 0;
    game.loseScore = 0;
    game.racketSize = createOneToOneGameDto.racketSize;
    game.ballSpeed = createOneToOneGameDto.ballSpeed;
    game.gameStatus = GameStatus.WAITING;

    const gameEntity = await this.gameRepository.createOneToOneGame(game);
    return this.mapGameEntityToOneToOneGameInfoDto(gameEntity);
  }

  async cancelOneToOneGame(user: UserEntity, gameId: number): Promise<void> {
    const game = await this.gameRepository.getGameByGameId(gameId);
    this.validateOneToOneGame(game);
    if (game.winner.id !== user.id)
      throw new NotFoundException('You are not in this game');
    await this.gameRepository.deleteGameByGameId(gameId);
  }

  async startOneToOneGame(
    user: UserEntity,
    gameId: number,
  ): Promise<GameEntity> {
    const game = await this.gameRepository.getGameByGameId(gameId);
    this.validateOneToOneGame(game);
    if (game.loser && game.loser.id !== user.id)
      throw new NotFoundException('You are not in this game');
    game.gameStatus = GameStatus.PLAYING;
    game.loser = user;
    await this.gameRepository.updateGame(game);
    return game;
  }

  validateOneToOneGame(game: GameEntity) {
    if (!game) throw new NotFoundException("Couldn't find game");
    if (game.gameStatus !== GameStatus.WAITING)
      throw new NotFoundException('Game is not waiting');
  }

  mapGameEntityToOneToOneGameInfoDto(game: GameEntity): OneToOneGameInfoDto {
    const dto = new OneToOneGameInfoDto();
    dto.id = game.id;
    dto.gameType = game.gameType;
    dto.ballSpeed = game.ballSpeed;
    dto.racketSize = game.racketSize;
    dto.userId = game.winner.id;
    return dto;
  }

  async canMakeOneToOneGame(
    userId: number,
    targetUserId: number | null,
  ): Promise<boolean> {
    const userIds = [userId, targetUserId];
    let isInGame = false;
    userIds.forEach(async (id) => {
      if (id) {
        const gameList: GameEntity[] = await this.getGameByUserId(id);
        gameList.forEach((game) => {
          if (
            game.gameStatus === GameStatus.WAITING ||
            game.gameStatus === GameStatus.PLAYING
          )
            isInGame = true;
        });
      }
    });
    return isInGame;
  }
}
