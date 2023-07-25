import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe as ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto } from './channel.dto';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';

@Controller('/channel')
@UseInterceptors(TransformInterceptor)
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  logger = new Logger(ChannelController.name);

  @Post()
  @UseGuards(AuthGuard())
  async createChannel(
    @GetUser('id') userId: number,
    @Body('channelInfo', ChannelTypePipe)
    channelInfo: CreateChannelDto,
    @Body('channelUserIds', NumArrayPipe)
    channelUserIds: number[],
  ) {
    channelInfo.ownerId = userId;
    return this.channelService.createChannel(channelInfo, channelUserIds);
  }

  @Post('/join')
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser('id') userId: number,
    @Body() createChannelUserDto: CreateChanneUserDto,
  ) {
    const { channelId } = createChannelUserDto;
    if (await this.channelService.isChannelUser(userId, channelId)) {
      throw new UnauthorizedException({
        message: `User is already joined channel`,
      });
    }
    createChannelUserDto.userId = userId;
    return this.channelService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.channelService.getVisibleChannel();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getChannels(@GetUser('id') userId: number) {
    return this.channelService.getChannelByUserId(userId);
  }
}
