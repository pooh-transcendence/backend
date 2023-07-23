import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto } from './channel.dto';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';

@Controller('/channel')
export class ChannelController {
  constructor(private chatService: ChannelService) {}

  @Post()
  @UseGuards(AuthGuard())
  async createChannel(
    @Body('ChannelInfo', ChannelTypePipe) ChannelInfo: CreateChannelDto,
    @Body('ChannelUserInfo') ChannelUserInfo: CreateChanneUserDto[],
  ) {
    const { owner } = ChannelInfo;
    return this.chatService.createChannel(owner, ChannelInfo, ChannelUserInfo);
  }

  @Post('/join')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser('id') userId: number,
    @Body() createChannelUserDto: CreateChanneUserDto,
  ) {
    const { channelId } = createChannelUserDto;
    if (await this.chatService.isChannelUser(userId, channelId)) {
      throw new UnauthorizedException({
        message: '이미 채널에 가입되어 있습니다.',
      });
    }
    return this.chatService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.chatService.getVisibleChannel();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getChannels(@GetUser('id') userId: number) {
    return this.chatService.getChannelByUserId(userId);
  }
}
