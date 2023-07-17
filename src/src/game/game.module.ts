import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { MatchRepository } from './match.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match])
  ],
  controllers: [GameController],
  providers: [GameService, MatchRepository]
})
export class GameModule { }
