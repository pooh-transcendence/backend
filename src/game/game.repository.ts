import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateGameDto } from './game.dto';
import { GameEntity, GameStatus, GameType } from './game.entity';

export class GameRepository extends Repository<GameEntity> {
  constructor(@InjectRepository(GameEntity) private dataSource: DataSource) {
    super(GameEntity, dataSource.manager);
  }

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
    const game = this.create(createGameDto);
    if (!game) throw new InternalServerErrorException();
    try {
      await this.save(game);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing game');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return game;
  }

  async createOneToOneGame(gameEntity: GameEntity): Promise<GameEntity> {
    const game = this.create(gameEntity);
    if (!game) throw new InternalServerErrorException();
    try {
      await this.save(game);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing game');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return game;
  }

  async getAllGame(): Promise<GameEntity[]> {
    return await this.find({
      relations: ['winner', 'loser'],
      order: { id: 'ASC' },
    });
  }

  async getGameByUserId(userId: number): Promise<GameEntity[]> {
    return await this.find({
      relations: ['winner', 'loser'],
      where: [{ winner: { id: userId } }, { loser: { id: userId } }],
      order: { id: 'ASC' },
    });
  }

  async getGameByGameId(gameId: number): Promise<GameEntity> {
    return await this.findOne({
      relations: ['winner', 'loser'],
      where: { id: gameId },
      order: { id: 'ASC' },
    });
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    const result = await this.delete({ id: gameId });
    if (result.affected !== 1)
      throw new NotFoundException(`there is no game id ${gameId}`);
  }

  async updateGame(game: GameEntity): Promise<void> {
    const result = await this.update(game.id, game);
    if (result.affected !== 1)
      throw new NotFoundException(`there is no game id ${game.id}`);
  }

  async getAllPublicWaitingGame(): Promise<GameEntity[]> {
    const publicWaitingGames = await this.createQueryBuilder('game')
      // .select('DISTINCT game.id', 'id')
      // .addSelect('game.gameType', 'gameType')
      // .addSelect('game.winnerId', 'userId')
      // .addSelect('game.ballSpeed', 'ballSpeed')
      // .addSelect('game.racketSize', 'racketSize')
      // .from(GameEntity, 'game')
      .select([
        'game.id',
        'game.gameType',
        'game.winnerId',
        'game.ballSpeed',
        'game.racketSize',
      ])
      .where('game.gameStatus = :gameStatus AND game.gameType = :gameType', {
        gameStatus: GameStatus.WAITING,
        gameType: GameType.ONEVSONE_PUBLIC,
      })
      .getRawMany();
    return publicWaitingGames;
  }

  async getAllPrivateWaitingGame(userId: number): Promise<GameEntity[]> {
    const privateWaitingGames = await this.createQueryBuilder('game')
      .select([
        'game.id',
        'game.gameType',
        'game.winnerId',
        'game.ballSpeed',
        'game.racketSize',
      ])
      .where('game.gameStatus = :gameStatus AND game.gameType = :gameType', {
        gameStatus: GameStatus.WAITING,
        gameType: GameType.ONEVSONE_PRIVATE,
      })
      .andWhere('game.loserId = :userId', { userId: userId })
      .getRawMany();
    return privateWaitingGames;
  }
}
