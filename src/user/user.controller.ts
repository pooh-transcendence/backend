import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';

@Controller('user')
@UseInterceptors(TransformInterceptor)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private userService: UserService) {}

  private logger = new Logger(UserController.name);

  @Get('/:nickname')
  async getUserByNickname(@Param('nickname') nickname: string) {
    return await this.userService.getUserByNickname(nickname);
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    this.logger.debug(`createUserDto: ${JSON.stringify(createUserDto)}`);
    return await this.userService.createUser(createUserDto);
  }

  @Get('/:userId')
  async getUserById(
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ) {
    return await this.userService.getUserById(userId);
  }
}
