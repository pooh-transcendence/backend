import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';
import { FriendEntity } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { BlockService } from 'src/block/block.service';
import { BlockRepository } from 'src/block/block.repository';
import { BlockEntity } from 'src/block/block.entity';
import { PassportModule } from '@nestjs/passport';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelRepository } from 'src/channel/channel.repository';
import { ChannelUserEntity } from 'src/channel/channel-user.entity';
import { ChannelEntity } from 'src/channel/channel.entity';
import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FriendEntity,
      UserEntity,
      BlockEntity,
      ChannelEntity,
      ChannelUserEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
  ],
  controllers: [FriendController],
  providers: [
    FriendRepository,
    FriendService,
    UserRepository,
    UserService,
    BlockService,
    BlockRepository,
    ChannelService,
    ChannelRepository,
    ChannelUserRepository,
  ],
  exports: [FriendService],
})
export class FriendModule {}
