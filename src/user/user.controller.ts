import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

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
}
