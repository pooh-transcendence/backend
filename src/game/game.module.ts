import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './game.entity';
import { GameRepository } from './game.repository';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelRepository } from 'src/channel/channel.repository';
import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { FriendService } from 'src/friend/friend.service';
import { FriendRepository } from 'src/friend/friend.respository';
import { BlockRepository } from 'src/block/block.repository';
import { BlockService } from 'src/block/block.service';
import { ChannelEntity } from 'src/channel/channel.entity';
import { ChannelUserEntity } from 'src/channel/channel-user.entity';
import { BlockEntity } from 'src/block/block.entity';
import { FriendEntity } from 'src/friend/friend.entity';
import { MessageEntity } from 'src/channel/message.entity';
import { PassportModule } from '@nestjs/passport';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelUserEntity,
      UserEntity,
      BlockEntity,
      FriendEntity,
      MessageEntity,
      GameEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [GameController],
  providers: [
    ChannelService,
    ChannelRepository,
    ChannelUserRepository,
    UserRepository,
    AuthService,
    UserService,
    JwtService,
    FriendService,
    FriendRepository,
    BlockRepository,
    BlockService,
    GameService,
    GameRepository,
    GameGateway,
  ],
})
export class GameModule {}
