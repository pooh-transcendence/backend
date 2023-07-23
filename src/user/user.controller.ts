import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  private logger = new Logger(UserController.name);

  @Get('/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
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
}
