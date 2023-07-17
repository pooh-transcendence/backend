import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { GameRepository } from './game.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity])
  ],
  controllers: [GameController],
  providers: [GameService, GameRepository]
})
export class GameModule { }
