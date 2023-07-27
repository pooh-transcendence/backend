import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChanneUserDto } from './channel-user.dto';
import { ChannelTypePipe as ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { CreateChannelDto, UpdateChannelDto } from './channel.dto';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from 'src/user/user.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';

@Controller('/channel')
@UseInterceptors(TransformInterceptor)
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
    this.verifyOwnerIdMatch(user.id, channelInfo.ownerId);
    return await this.channelService.createChannel(channelInfo, channelUserIds);
  }

  @Post('/join')
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser() user: UserEntity,
    @Body() channelUserInfo: CreateChanneUserDto,
  ) {
    this.verifyOwnerIdMatch(user.id, channelUserInfo.userId);
    return await this.channelService.joinChannelUser(channelUserInfo);
  }

  @Get('/visible')
  async getVisibleChannel() {
    return await this.channelService.getVisibleChannel();
  }

  @Get()
  @UseGuards(AuthGuard())
  async getChannels(@GetUser() user: UserEntity) {
    return await this.channelService.getChannelListByUserId(user.id);
  }

  @Patch('/ban')
  @UseGuards(AuthGuard())
  async banChannelUser(
    @GetUser() user: UserEntity,
    @Body('channelUserInfo') channelUserInfo: UpdateChannelDto,
  ) {
    this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
    return await this.channelService.banChannelUser(user.id, channelUserInfo);
  }

  @Delete('/kick')
  @UseGuards(AuthGuard())
  async kickChannelUser(
    @GetUser() user: UserEntity,
    @Body('channelUserInfo') channelUserInfo: UpdateChannelDto,
  ) {
    this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
    return await this.channelService.kickChannelUser(user.id, channelUserInfo);
  }

  @Delete()
  @UseGuards(AuthGuard())
  async leaveChannel(
    @GetUser() user: UserEntity,
    @Body('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
  ) {
    return await this.channelService.leaveChannel(user.id, channelId);
  }

  @Patch('/admin')
  @UseGuards(AuthGuard())
  async setAdmin(
    @GetUser() user: UserEntity,
    @Body('channelUserInfo') channelUserInfo: UpdateChannelDto,
  ) {
    return await this.channelService.setAdmin(user.id, channelUserInfo);
  }

  verifyOwnerIdMatch(userId: number, ownerId: number) {
    if (userId !== ownerId)
      return new HttpException(
        `ownerId(${ownerId}) doesn't match userId(${userId})`,
        HttpStatus.BAD_REQUEST,
      );
  }

  verifyNotSelfBanOrKick(fromUserId: number, toUserId: number) {
    if (fromUserId === toUserId)
      throw new HttpException(
        `You can't ban or kick yourself`,
        HttpStatus.BAD_REQUEST,
      );
  }
}
