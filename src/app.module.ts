import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';
import { DataSource } from 'typeorm';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { BlockModule } from './block/block.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ChatModule, UserModule, GameModule, BlockModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule {
}
