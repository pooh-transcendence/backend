import { Body, ConsoleLogger, Controller, HttpException, HttpStatus, InternalServerErrorException, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.entity';
import { updateUserDto } from './update-user.dto';

@Controller('user')
export class UserController {
    constructor (private userService : UserService){}

    @Post()
    @UsePipes(ValidationPipe)
    async createUser(@Body() createUserDto : CreateUserDto) : Promise<User>{
        const user = await this.userService.createUser(createUserDto);
        if (!user)
            throw new HttpException(`Exist user ${createUserDto.username}`,HttpStatus.BAD_REQUEST);
        return user;
    }

    @Post('/update')
    async updateUser(@Body() updateUserDto : updateUserDto){
        const user = await this.userService.updateUser(updateUserDto);
        if (!user)
            throw new HttpException(`Not exist user ${updateUserDto.username}`,HttpStatus.BAD_REQUEST);
        return user;
    }
}
