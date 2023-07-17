import { ConsoleLogger, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './createuser.dto';
import { User } from './user.entity';
import { BlockRepository } from './block.repository';
import { Block } from './block.entity';
import { CreateBlockDto } from './block.dto';

@Injectable()
export class UserService {
    constructor(private userRepository: UserRepository,
        private blockRepository: BlockRepository) { }

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


    async createBlock(createBlockDto: CreateBlockDto): Promise<Block> {
        return this.blockRepository.createBlock(createBlockDto);
    }

    async deleteBlock(deleteBlockDto: CreateBlockDto) {
        return this.blockRepository.deleteBlock(deleteBlockDto);
    }

    async getBlockByFromId(userId: number) {
        const found = await this.blockRepository.getBlockByFromId(userId);
        found.forEach((block) => { block.from = undefined; });
        return found;
    }

}