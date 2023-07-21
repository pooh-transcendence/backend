import { Module } from '@nestjs/common';
import { ChannelModule } from './channel/channel.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';
import { DataSource } from 'typeorm';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { BlockController } from './block/block.controller';
import { BlockModule } from './block/block.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ChannelModule,
    UserModule,
    GameModule,
    BlockModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
