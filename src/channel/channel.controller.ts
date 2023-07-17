import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { typeOrmConfig } from 'src/configs/typeorm.config';
import { UpdateChannelDto } from './channel.dto';
import { CreateUserDto } from 'src/user/create-user.dto';
import { CreateChanneUserDto } from './channel-user.dto';

@Controller('/channel')
export class ChannelController {
    constructor(private chatService: ChannelService) { }

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
