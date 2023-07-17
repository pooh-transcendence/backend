import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { typeOrmConfig } from 'src/configs/typeorm.config';
import { UpdateChannelDto } from './channel.dto';
import { CreateUserDto } from 'src/user/createuser.dto';
import { CreateChanneUserDto } from './channeluser.dto';

@Controller('/chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Post()
    async createChannel(@Body() data) {
        const { owner, ChannelInfo, ChannelUserInfo } = data;
        return this.chatService.createChannel(owner, ChannelInfo, ChannelUserInfo);
    }

    @Post('/join')
    async joinChannel(@Body() createChannelUserDto: CreateChanneUserDto) {
        return this.chatService.joinChannelUser(createChannelUserDto);
    }

    @Get('/visual')
    async getVisualChannel() {
        return this.chatService.getVisualChannel();
    }
}
