import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { FriendEntity } from '../friend/friend.entity';
import { BlockService } from 'src/block/block.service';
import { BlockRepository } from 'src/block/block.repository';
import { BlockEntity } from 'src/block/block.entity';
import { FriendRepository } from 'src/friend/friend.respository';
import { FriendService } from 'src/friend/friend.service';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelEntity } from 'src/channel/channel.entity';
import { ChannelUserEntity } from 'src/channel/channel-user.entity';
import { ChannelRepository } from 'src/channel/channel.repository';
import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { ChannelService } from 'src/channel/channel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      FriendEntity,
      BlockEntity,
      ChannelEntity,
      ChannelUserEntity,
    ]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    FriendRepository,
    FriendService,
    BlockRepository,
    BlockService,
    ChannelRepository,
    ChannelUserRepository,
    ChannelService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
