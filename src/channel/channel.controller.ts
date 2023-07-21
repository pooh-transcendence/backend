import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto } from './channel.dto';

@Controller('/channel')
export class ChannelController {
  constructor(private chatService: ChannelService) {}

  @Post()
  async createChannel(
    @Body('ChannelInfo', ChannelTypePipe) ChannelInfo: CreateChannelDto,
    @Body('ChannelUserInfo') ChannelUserInfo: CreateChanneUserDto[],
  ) {
    const { owner } = ChannelInfo;
    return this.chatService.createChannel(owner, ChannelInfo, ChannelUserInfo);
  }

  @Post('/join')
  @UsePipes(ValidationPipe)
  async joinChannel(@Body() createChannelUserDto: CreateChanneUserDto) {
    return this.chatService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.chatService.getVisibleChannel();
  }
}
