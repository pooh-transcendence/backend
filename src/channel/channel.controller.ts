import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe as ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto } from './channel.dto';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from 'src/user/user.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';

@Controller('/channel')
@UseGuards(AuthGuard())
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  logger = new Logger(ChannelController.name);

  @Post()
  @UseGuards(AuthGuard())
  async createChannel(
    @GetUser() user: UserEntity,
    @Body('channelInfo', ChannelTypePipe)
    channelInfo: CreateChannelDto,
    @Body('channelUserIds', NumArrayPipe)
    channelUserIds: number[],
  ) {
    this.verifyUserIdMatch(user.id, channelInfo.ownerId);
    return this.channelService.createChannel(channelInfo, channelUserIds);
  }

  @Post('/join')
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser() user: UserEntity,
    @Body() createChannelUserDto: CreateChanneUserDto,
  ) {
    this.verifyUserIdMatch(user.id, createChannelUserDto.userId);
    return this.channelService.joinChannelUser(createChannelUserDto);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return this.channelService.getVisibleChannel();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getChannels(@GetUser() user: UserEntity) {
    return this.channelService.getChannelListByUserId(user.id);
  }

  @Delete()
  @UseGuards(AuthGuard())
  async quickLeaveChannel(
    @GetUser() uesr: UserEntity,
    @Body('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
  ) {
    return await this.channelService.quickLeaveChannel(uesr.id, channelId);
  }

  async verifyUserIdMatch(userId: number, requestUserId: number) {
    if (userId !== requestUserId)
      throw new HttpException(
        `User id ${userId} does not match request user id ${requestUserId}`,
        HttpStatus.BAD_REQUEST,
      );
  }
}
