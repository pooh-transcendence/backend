import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { GameRepository } from './game.repository';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { GameGateway } from './game.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, UserEntity])],
  controllers: [GameController],
  providers: [GameService, GameRepository, UserRepository, GameGateway],
})
export class GameModule {}
