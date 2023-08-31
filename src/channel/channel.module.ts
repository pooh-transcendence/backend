import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { BlockEntity } from 'src/block/block.entity';
import { BlockRepository } from 'src/block/block.repository';
import { BlockService } from 'src/block/block.service';
import { FriendEntity } from 'src/friend/friend.entity';
import { FriendRepository } from 'src/friend/friend.respository';
import { FriendService } from 'src/friend/friend.service';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { ChannelUserEntity } from './channel-user.entity';
import { ChannelUserRepository } from './channel-user.repository';
import { ChannelController } from './channel.controller';
import { ChannelEntity } from './channel.entity';
import { ChannelGateway } from './channel.gateway';
import { ChannelRepository } from './channel.repository';
import { ChannelService } from './channel.service';
import { MessageEntity } from './message.entity';
import { MesssageRepository } from './message.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelUserEntity,
      UserEntity,
      BlockEntity,
      FriendEntity,
      MessageEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ChannelRepository,
    ChannelUserRepository,
    UserRepository,
    ChannelGateway,
    AuthService,
    UserService,
    JwtService,
    FriendService,
    FriendRepository,
    BlockRepository,
    BlockService,
    MesssageRepository,
  ],
  exports: [ChannelService],
})
export class ChannelModule {}
