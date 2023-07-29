import {
  Body,
  Controller,
  Delete,
  Logger,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { UserEntity } from 'src/user/user.entity';

@Controller('friend')
@UseGuards(AuthGuard())
export class FriendController {
  constructor(private friendService: FriendService) {}

  private logger = new Logger(FriendController.name);

  @Delete()
  async deleteFriend(
    @GetUser() user: UserEntity,
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const userId = user.id;
    await this.friendService.deleteFriend({
      from: userId,
      to: followingUserId,
    });
  }

  @Post()
  async createFriend(
    @GetUser() user: UserEntity,
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const userId = user.id;
    return await this.friendService.creatFriend({
      from: userId,
      to: followingUserId,
    });
  }
}
