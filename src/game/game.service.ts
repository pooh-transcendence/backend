import { Injectable, NotFoundException } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { CreateGameDto } from './game.dto';
import { GameEntity } from './game.entity';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class GameService {
  constructor(private gameRepository: GameRepository, private userRepository: UserRepository) { }

  async createGame(createGameDto: CreateGameDto): Promise<GameEntity> {
    const [id1, id2] = createGameDto.participants;
    const user1 = await this.userRepository.getUserById(id1);
    const user2 = await this.userRepository.getUserById(id2);
    if (!user1 || !user2)
      throw new NotFoundException("Couldn't find users");
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

  async getGameByGameId(gameId: number): Promise<GameEntity[]> {
    return await this.gameRepository.getGameByGameId(gameId);
  }

  async deleteGameByGameId(gameId: number): Promise<void> {
    await this.gameRepository.deleteGameByGameId(gameId);
  }
}
