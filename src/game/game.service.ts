import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { CreateGameDto, CreateOneToOneGameDto } from './game.dto';
import { GameEntity, GameStatus, GameType } from './game.entity';
import { GameRepository } from './game.repository';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private userRepository: UserRepository,
    private userService: UserService,
  ) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
    const [id1, id2] = createGameDto.participants;
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

  async getAllWaitingGame(userId: number): Promise<GameEntity[]> {
    const publicGame: GameEntity[] =
      await this.gameRepository.getAllPublicWaitingGame();
    const privateGames: GameEntity[] =
      await this.gameRepository.getAllPrivateWaitingGame(userId);
    return [...publicGame, ...privateGames];
  }

  async createOneToOneGame(
    userId: number,
    createOneToOneGameDto: CreateOneToOneGameDto,
  ): Promise<void> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user) throw new NotFoundException("Couldn't find user");

    const game = new GameEntity();
    if (createOneToOneGameDto.targetNickname) {
      if (createOneToOneGameDto.targetNickname === user.nickname)
        throw new NotFoundException("Target user can't be same as user");
      if (!createOneToOneGameDto.targetNickname) {
        // public 1vs1 game
        game.gameType = GameType.ONEVSONE_PUBLIC;
        game.loser = null;
      } else {
        const targetUser = await this.userRepository.getUserByNickname(
          createOneToOneGameDto.targetNickname,
        );
        if (!targetUser)
          throw new NotFoundException("Couldn't find target user");
        // private 1vs1 game
        game.gameType = GameType.ONEVSONE_PRIVATE;
        game.loser = targetUser;
      }
    }

    game.winner = user;
    game.winScore = 0;
    game.loseScore = 0;
    game.ballSpeed = createOneToOneGameDto.ballSpeed;
    game.gameStatus = GameStatus.WAITING;

    return await this.gameRepository.createOneToOneGameDto(game);
  }

  async startOneToOneGame(user: UserEntity, gameId: number) {
    const game = await this.gameRepository.getGameByGameId(gameId);
    if (!game) throw new NotFoundException("Couldn't find game");
    if (game.gameStatus !== GameStatus.WAITING)
      throw new NotFoundException('Game is not waiting');
    if (game.loser && game.loser.id !== user.id)
      throw new NotFoundException('You are not in this game');
    game.gameStatus = GameStatus.PLAYING;
    game.loser = user;
    await this.gameRepository.updateGame(game);
    return game;
  }
}
