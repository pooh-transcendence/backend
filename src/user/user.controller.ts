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
import { FriendDto, CreateUserDto } from './user.dto';
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

  @Get('/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
    // TODO: validation 필요
    return await this.userService.getUserByNickname(nickname);
  }

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

  // @Get('/friend/:id')
  // async getUserFriend(@Param('id', ParseIntPipe, PositiveIntPipe) id: number) {
  //   return await this.friendService.getFriendListByUserId(id);
  // }

  @Delete('/friend')
  async deleteUserFriend(@Body() createFriendDto: FriendDto) {
    // deleteFriendDto 에 to 만 넣어서 변경
    await this.friendService.deleteFriend(createFriendDto);
  }

  @Post('/friend')
  async createFriend(@Body() createFriendDto: FriendDto) {
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
