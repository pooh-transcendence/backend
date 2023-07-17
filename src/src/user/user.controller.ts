import { Body, ConsoleLogger, Controller, Get, HttpException, HttpStatus, InternalServerErrorException, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './createuser.dto';
import { User } from './user.entity';
import { getegid } from 'process';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Get('/:id')
    async getUserById(@Param('id') userId: number) {
        return this.userService.getUserById(userId);
    }

    @Get()
    async getAllUser() {
        return this, this.userService.getAllUser();
    }
}
