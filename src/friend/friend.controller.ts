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
  UseInterceptors,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { UserEntity } from 'src/user/user.entity';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';
import { UserService } from 'src/user/user.service';

@Controller('friend')
@UseInterceptors(TransformInterceptor)
@UseGuards(AuthGuard())
export class FriendController {
  constructor(
    private friendService: FriendService,
    private userSerivce: UserService,
  ) {}

  private logger = new Logger(FriendController.name);

  @Delete()
  async deleteFriend(
    @GetUser() user: UserEntity,
    @Body('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const userId = user.id;
    if (userId === followingUserId)
      throw new HttpException(
        `Can't remove yourself from your friend list`,
        HttpStatus.BAD_REQUEST,
      );
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
    if (userId === followingUserId)
      throw new HttpException(
        `Can't be friend with yourself`,
        HttpStatus.BAD_REQUEST,
      );
    return await this.friendService.creatFriend({
      from: userId,
      to: followingUserId,
    });
  }

  @Get()
  async getFriendList(@GetUser() user: UserEntity) {
    const userId = user.id;
    const friendIds = await this.friendService.getFriendListByFromId(userId);
    const friendList = [];
    for (const id of friendIds) {
      friendList.push(
        await this.userSerivce.getUserElementsById(id.to, [
          'id, username, avatar',
        ]),
      );
    }
    return friendList;
  }
}
