import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { CreateGameDto } from './game.dto';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

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

  async getAllGame(): Promise<GameEntity[]> {
    return this.find({ relations: ['winner', 'loser'], order: { id: 'ASC' } });
  }

  async getGameByUserId(userId: number): Promise<GameEntity[]> {
    return this.find({
      relations: ['winner', 'loser'],
      where: [{ winner: { id: userId } }, { loser: { id: userId } }],
      order: { id: 'ASC' },
    });
  }

  async getGameByGameId(gameId: number): Promise<GameEntity> {
    return this.findOne({
      relations: ['winner', 'loser'],
      where: { id: gameId },
      order: { id: 'ASC' },
    });
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    const result = await this.softDelete({ id: gameId });
    if (result.affected !== 1)
      throw new NotFoundException(`there is no game id ${gameId}`);
  }
}
