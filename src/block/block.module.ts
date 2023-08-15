import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockEntity } from './block.entity';
import { BlockController } from './block.controller';
import { BlockRepository } from './block.repository';
import { BlockService } from './block.service';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { FriendEntity } from 'src/friend/friend.entity';
import { FriendRepository } from 'src/friend/friend.respository';
import { FriendService } from 'src/friend/friend.service';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelRepository } from 'src/channel/channel.repository';
import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { ChannelEntity } from 'src/channel/channel.entity';
import { ChannelUserEntity } from 'src/channel/channel-user.entity';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ChannelGateway } from 'src/channel/channel.gateway';
import { GameGateway } from 'src/game/game.gateway';
import { GameService } from 'src/game/game.service';
import { GameEntity } from 'src/game/game.entity';
import { GameRepository } from 'src/game/game.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockEntity,
      UserEntity,
      FriendEntity,
      ChannelEntity,
      ChannelUserEntity,
      GameEntity,
    ]),
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [BlockController],
  providers: [
    BlockRepository,
    BlockService,
    UserRepository,
    UserService,
    FriendRepository,
    FriendService,
    ChannelService,
    ChannelRepository,
    ChannelUserRepository,
    AuthService,
    JwtService,
  ],
  exports: [BlockService],
})
export class BlockModule {}
