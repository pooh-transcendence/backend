import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelEntity, ChannelUserEntity])],
  controllers: [ChannelController],
  providers: [ChannelService, ChannelRepository, ChannelUserRepository],
})
export class ChannelModule {}
