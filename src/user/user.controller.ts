import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';
import { GetUser } from 'src/auth/get-user.decostor';
import { UserEntity } from './user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
@UseInterceptors(TransformInterceptor)
@UseGuards(AuthGuard())
export class UserController {
  constructor(private userService: UserService) {}

  private logger = new Logger(UserController.name);

  // 유저 본인의 정보를 가져온다.
  @Get()
  async getUser(@GetUser('id') userId: number): Promise<UserEntity> {
    return await this.userService.getUserById(userId);
  }

  // 유저의 닉네임으로 유저 정보를 가져온다.
  @Get('/search/:nickname')
  async getUserProfileByNickname(
    @GetUser('id') userId: number,
    @Param('nickname') nickname: string,
  ): Promise<UserProfileDto> {
    const user = await this.userService.getUserProfileByNickname(
      userId,
      nickname,
    );
    return user;
  }

  @Get('/:userId')
  async getUserProfileById(
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ): Promise<UserProfileDto> {
    return await this.userService.getUserProfileById(userId);
  }

  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }
}
