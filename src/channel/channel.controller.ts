import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { TransformInterceptor } from 'src/common/interceptors/tranform.interceptor';
import { ChannelTypePipe } from 'src/common/pipes/channelType.pipe';
import { NumArrayPipe } from 'src/common/pipes/numArray.pipe';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';
import { CreateChannelUserDto } from './channel-user.dto';
import {
  CreateChannelDto,
  UpdateChannelDto,
  UpdateChannelUserDto,
} from './channel.dto';
import { ChannelService } from './channel.service';
import { ChannelGateway } from './channel.gateway';
import { UserService } from 'src/user/user.service';
import { ChannelType } from './channel.entity';

@Controller('/channel')
@UseInterceptors(TransformInterceptor)
export class ChannelController {
  constructor(
    private channelService: ChannelService,
    private channelGateway: ChannelGateway,
    private userService: UserService,
  ) {}

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
    this.verifyRequestIdMatch(user.id, channelInfo.ownerId);
    const result = await this.channelService.createChannel(
      channelInfo,
      channelUserIds,
    );
    if (result.password) result.password = undefined;
    result['ownerNickname'] = user.nickname;
    console.log('channelInfo', channelInfo);
    console.log('result: ', result);
    const _user = await this.userService.getUserById(user.id);
    if (result.channelType !== ChannelType.PRIVATE)
      ChannelGateway.emitToAllClient('addChannelToAllChannelList', result);
    if (_user.channelSocketId)
      ChannelGateway.emitToClient(
        _user.channelSocketId,
        'addChannelToUserChannelList',
        result,
      );
    return result;
  }

  @Post('/join')
  @UseGuards(AuthGuard())
  async joinChannel(
    @GetUser() user: UserEntity,
    @Body() channelUserInfo: CreateChannelUserDto,
  ) {
    this.verifyRequestIdMatch(user.id, channelUserInfo.userId);
    const result = await this.channelService.joinChannelUser(channelUserInfo);
    const resultChannel = await this.channelService.getChannelByChannelId(
      result.channelId,
    );
    if (resultChannel.password) resultChannel.password = undefined;
    const _user = await this.userService.getUserById(user.id);
    if (_user.channelSocketId)
      ChannelGateway.emitToClient(
        _user.channelSocketId,
        'addChannelToUserChannelList',
        resultChannel,
      );
    ChannelGateway.emitToAllClient('changeChannelState', resultChannel);
    return result;
  }

  @Get('/visible')
  async getVisibleChannel() {
    return await this.channelService.getVisibleChannel();
  }

  @Patch('/ban')
  @UseGuards(AuthGuard())
  async banChannelUser(
    @GetUser() user: UserEntity,
    @Body() channelUserInfo: UpdateChannelUserDto,
  ) {
    this.verifyNotSelfBanOrKick(user.id, channelUserInfo.userId);
    return await this.channelService.banChannelUser(user.id, channelUserInfo);
  }

  @Delete('/kick')
  @UseGuards(AuthGuard())
  async kickChannelUser(
    @GetUser() user: UserEntity,
    @Body() channelUserInfo: UpdateChannelUserDto,
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
    const result = await this.channelService.leaveChannel(user.id, channelId);
    const _user = await this.userService.getUserById(user.id);
    if (_user.channelSocketId) {
      ChannelGateway.emitToClient(
        _user.channelSocketId,
        'deleteChannelToUserChannelList',
        channelId,
      );
      const userSocket = ChannelGateway.server.sockets.get(
        _user.channelSocketId,
      );
      userSocket.leave(channelId.toString());
    }
    const channel = await this.channelService.getChannelByChannelId(channelId);
    ChannelGateway.emitToAllClient('changeChannelState', channel);
    if (result) {
      ChannelGateway.emitToAllClient('deleteChannelToAllChannelList', {
        channelId,
      });
    }
  }

  @Patch('/admin')
  @UseGuards(AuthGuard())
  async setAdmin(
    @GetUser() user: UserEntity,
    @Body() channelUserInfo: UpdateChannelUserDto,
  ) {
    if (user.id === channelUserInfo.userId)
      throw new HttpException(
        `You can't set yourself as admin`,
        HttpStatus.BAD_REQUEST,
      );
    return await this.channelService.setAdmin(user.id, channelUserInfo);
  }

  @Get('/admin/:channelId')
  async getAdmin(
    @Param('channelId', ParseIntPipe, PositiveIntPipe) channelId: number,
  ) {
    const channel = await this.channelService.getChannelByChannelId(channelId);
    if (!channel)
      throw new HttpException(`Channel not found`, HttpStatus.BAD_REQUEST);
    return await this.channelService.getChannelAdminId(channelId);
  }

  @Patch('/password')
  @UseGuards(AuthGuard())
  async updatePassword(
    @GetUser() user: UserEntity,
    @Body() channelInfo: UpdateChannelDto,
  ) {
    const result = await this.channelService.updatePassword(
      user.id,
      channelInfo,
    );
    if (result.password) result.password = undefined;
    ChannelGateway.emitToAllClient('changeChannelState', result);
    return result;
  }

  @Patch('/invite')
  @UseGuards(AuthGuard())
  async inviteUser(
    @GetUser() user: UserEntity,
    @Body() createChannelUserDto: CreateChannelUserDto,
  ) {
    return await this.channelService.inviteUserToChannel(
      user.id,
      createChannelUserDto,
    );
  }

  verifyRequestIdMatch(userId: number, requestBodyUserId: number) {
    if (userId !== requestBodyUserId)
      throw new HttpException(
        `Id in request body doesn't match with your id`,
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
