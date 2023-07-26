import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtModuleConfig } from 'src/configs/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './access-token.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { FriendService } from 'src/friend/friend.service';
import { FriendRepository } from 'src/friend/friend.respository';
import { BlockRepository } from 'src/block/block.repository';
import { BlockService } from 'src/block/block.service';
import { ChannelRepository } from 'src/channel/channel.repository';
import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { ChannelService } from 'src/channel/channel.service';
import { FriendEntity } from 'src/friend/friend.entity';
import { BlockEntity } from 'src/block/block.entity';
import { ChannelEntity } from 'src/channel/channel.entity';
import { ChannelUserEntity } from 'src/channel/channel-user.entity';
import { FortyTwoApiService } from './fortytwo.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register(JwtModuleConfig),
    TypeOrmModule.forFeature([
      UserEntity,
      FriendEntity,
      BlockEntity,
      ChannelEntity,
      ChannelUserEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtStrategy,
    UserService,
    FriendService,
    FriendRepository,
    BlockRepository,
    BlockService,
    ChannelRepository,
    ChannelUserRepository,
    ChannelService,
    FortyTwoApiService,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
