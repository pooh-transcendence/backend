import { Module } from '@nestjs/common';
import { ChannelModule } from './channel/channel.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { BlockModule } from './block/block.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ChannelModule,
    UserModule,
    GameModule,
    BlockModule,
    FriendModule,
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
