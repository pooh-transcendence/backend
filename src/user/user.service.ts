import { ConsoleLogger, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './createuser.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(private userRepository: UserRepository){}     

    async getAllUser(): Promise<User[]> {
        return this.userRepository.getAllUser();
    }

    async getUserById(userId: number): Promise<User> {
        const found = await this.userRepository.getUserById(userId);
        if (!found)
            throw new HttpException({ reason: `There is UserId ${userId}` },
                HttpStatus.BAD_REQUEST);
        return found;
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        return this.userRepository.createUser(createUserDto);
    }

    async deleteUser(userId: number) {
        this.userRepository.deleteUser(userId);
    }

    //User Update는 나중에 
}