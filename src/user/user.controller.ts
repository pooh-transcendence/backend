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
import { CreateBlockDto } from './block.dto';
import { BlockService } from './block.service';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private friendService: FriendService,
    private blockService: BlockService,
  ) {}

  private logger = new Logger(UserController.name);

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Get('/:userId')
  async getUserById(
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ) {
    return await this.userService.getUserById(userId);
  }

  @Get()
  async getAllUser() {
    return await this.userService.getAllUser();
  }

  @Get('/friend:/id')
  async getUserFriend(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
    return await this.friendService.getFriendListByUserId(id);
  }

  @Delete('/friend')
  async deleteUserFriend(@Body() createFriendDto: CreateFriendDto) {
    await this.friendService.deleteFriend(createFriendDto);
  }

  @Post('/friend')
  async createFriend(@Body() createFriendDto: CreateFriendDto) {
    return await this.friendService.creatFriend(createFriendDto);
  }

  @Get('/block/:id')
  async getUserBlock(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
    return await this.friendService.getFriendListByUserId(id);
  }

  @Delete('/block')
  async deleteBlock(@Body() createBlockDto: CreateBlockDto) {
    await this.blockService.deleteBlock(createBlockDto);
  }

  @Post('/block')
  async createBlock(@Body() createBlockDto: CreateBlockDto) {
    return await this.blockService.createBlock(createBlockDto);
  }
}
