import { Module, forwardRef } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { PassportModule } from '@nestjs/passport';
import { ChannelGateway } from './channel.gateway';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { FriendService } from 'src/friend/friend.service';
import { FriendRepository } from 'src/friend/friend.respository';
import { BlockRepository } from 'src/block/block.repository';
import { BlockService } from 'src/block/block.service';
import { BlockEntity } from 'src/block/block.entity';
import { FriendEntity } from 'src/friend/friend.entity';
import { MesssageRepository } from './message.repository';
import { MessageEntity } from './message.entity';

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
