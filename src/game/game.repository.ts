import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { CreateGameDto } from './create-game.dto';
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
    const game = await this.create(createGameDto);
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
    return this.find();
  }

  async getGameByUserId(userId: number): Promise<GameEntity[]> {
    return this.find({ relations: ['winnerGame', 'loserGame'] });
  }

  async getGameByGameId(gameId: number): Promise<GameEntity> {
    return this.findOneBy({ id: gameId });
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    const result = await this.delete({ id: gameId });
    if (result.affected === 0)
      throw new NotFoundException(`there is no game id ${gameId}`);
  }
}
