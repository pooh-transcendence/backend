import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { CreateFriendDto, CreateUserDto } from './user.dto';
import { FriendService } from './friend.service';
import { throwIfEmpty } from 'rxjs';
import { create } from 'domain';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private friendService: FriendService,
  ) {}

  private logger = new Logger(UserController.name);

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get('/:userId')
  async getUserById(
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ) {
    return this.userService.getUserById(userId);
  }

  @Get()
  async getAllUser() {
    return this.userService.getAllUser();
  }

  @Get('/friend:/id')
  async getUserFriend(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
    const friendId = await this.friendService.getFriendByFromId(id);
    const friend = [];
    for (const id of friendId) {
      friend.push(await this.userService.getUserByNameAndId(id.to));
    }
    return friend;
  }

  @Delete('/friend')
  async deleteUserFriend(@Body() createFriendDto: CreateFriendDto) {
    await this.friendService.deleteFriend(createFriendDto);
  }

  @Post('/friend')
  async createFriend(@Body() createFriendDto: CreateFriendDto) {
    return this.friendService.creatFriend(createFriendDto);
  }
}
