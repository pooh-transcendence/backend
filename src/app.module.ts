import { CacheModule } from '@nestjs/cache-manager';
import { Module, NestModule, ValidationPipe } from '@nestjs/common';
import { MiddlewareConsumer } from '@nestjs/common/interfaces';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockModule } from './block/block.module';
import { ChannelModule } from './channel/channel.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { cacheModuleConfig } from './configs/cache.config';
import { typeOrmConfig } from './configs/typeorm.config';
import { FriendModule } from './friend/friend.module';
import { GameModule } from './game/game.module';
import { UserModule } from './user/user.module';

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
    // consumer.apply(SocketLoggerMiddleware).forRoutes('*');
  }
}
