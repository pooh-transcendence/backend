import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto } from './channel.dto';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';

@Controller('/channel')
@UseGuards(AuthGuard())
export class ChannelController {
  constructor(private chatService: ChannelService) {}

  @Post()
  @UseGuards(AuthGuard())
  async createChannel(
    @GetUser() owner: UserEntity,
    @Body('ChannelInfo', ChannelTypePipe) ChannelInfo: CreateChannelDto,
    @Body('ChannelUserInfo') ChannelUserInfo: CreateChanneUserDto[], // TODO: ChannelUserId만 받으면 안되나여?
  ) {
    ChannelInfo.ownerId = owner.id;
    return this.chatService.createChannel(ChannelInfo, ChannelUserInfo);
  }

  @Post('/join')
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser('id') userId: number,
    @Body() createChannelUserDto: CreateChanneUserDto,
  ) {
    const { channelId } = createChannelUserDto;
    if (await this.chatService.isChannelUser(userId, channelId)) {
      throw new UnauthorizedException({
        message: `User is already joined channel`,
      });
    }
    createChannelUserDto.userId = userId;
    return this.chatService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.chatService.getVisibleChannel();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getChannels(@GetUser() user: UserEntity) {
    return this.chatService.getChannelByUserId(user.id);
  }
}
