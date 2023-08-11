import { Module, NestModule } from '@nestjs/common';
import { ChannelModule } from './channel/channel.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { BlockModule } from './block/block.module';
import { FriendModule } from './friend/friend.module';
import { MiddlewareConsumer } from '@nestjs/common/interfaces';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheModuleConfig } from './configs/cache.config';
import { SocketLoggerMiddleware } from './common/middlewares/socket-logger.middleware';

@Module({
  imports: [
    CacheModule.register(cacheModuleConfig),
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer.apply(SocketLoggerMiddleware).forRoutes('*');
  }
}
