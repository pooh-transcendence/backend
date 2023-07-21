import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserEntity } from 'src/user/user.entity';

@Controller('friend')
export class FriendController {
  constructor(private friendService: FriendService) {}

  private logger = new Logger(FriendController.name);

  private userId = 1; // TODO: jwt 후 삭제

  @Get()
  async getUserFriendList(): Promise<UserEntity[]> {
    // TODO: jwt
    return await this.friendService.getFriendListByUserId(this.userId); // TODO: jwt 후 this 삭제
  }

  @Delete()
  async deleteUserFriend(
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    // TODO: jwt
    await this.friendService.deleteFriend({
      from: this.userId,
      to: followingUserId,
    });
  }

  @Post()
  async createFriend(
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    // TODO: jwt
    return await this.friendService.creatFriend({
      from: this.userId,
      to: followingUserId,
    });
  }
}
