import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { CreateGameDto } from './create-game.dto';
import { GameEntity } from './game.entity';

@Injectable()
export class GameService {
  constructor(private gameRepository: GameRepository) {}

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
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
}
