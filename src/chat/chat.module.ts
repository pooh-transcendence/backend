import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './channel.entity';
import { ChannelUser } from './channeluser.entity';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channeluser.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelUser])],
  controllers: [ChatController],
  providers: [ChatService, ChannelRepository, ChannelUserRepository],
})
export class ChatModule { }
