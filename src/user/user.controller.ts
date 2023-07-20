import {
  Body,
  ConsoleLogger,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get('/:userId')
  async getUserById(@Param('userId') userId: number) {
    return this.userService.getUserById(userId);
  }

  @Get()
  async getAllUser() {
    return this, this.userService.getAllUser();
  }
}
