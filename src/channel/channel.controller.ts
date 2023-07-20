import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';

@Controller('/channel')
export class ChannelController {
  constructor(private chatService: ChannelService) {}

  @Post()
  async createChannel(@Body() data) {
    const { owner, ChannelInfo, ChannelUserInfo } = data;
    return this.chatService.createChannel(owner, ChannelInfo, ChannelUserInfo);
  }

  @Post('/join')
  async joinChannel(@Body() createChannelUserDto: CreateChanneUserDto) {
    return this.chatService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.chatService.getVisibleChannel();
  }
}
