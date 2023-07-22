import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';

@Controller('friend')
@UseGuards(AuthGuard())
export class FriendController {
  constructor(private friendService: FriendService) {}

  private logger = new Logger(FriendController.name);

  @Get()
  async getUserFriendList(
    @GetUser('id') userId: number,
  ): Promise<UserEntity[]> {
    return await this.friendService.getFriendListByUserId(userId); // TODO: jwt 후 this 삭제
  }

  @Delete()
  async deleteUserFriend(
    @GetUser('id') userId: number,
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    await this.friendService.deleteFriend({
      from: userId,
      to: followingUserId,
    });
  }

  @Post()
  async createFriend(
    @GetUser('id') userId: number,
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    return await this.friendService.creatFriend({
      from: userId,
      to: followingUserId,
    });
  }
}
