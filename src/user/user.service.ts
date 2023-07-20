import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './create-user.dto';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getAllUser(): Promise<UserEntity[]> {
    return this.userRepository.getAllUser();
  }

  async getUserById(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new HttpException(
        { message: `User with id ${userId} not found` },
        HttpStatus.BAD_REQUEST,
      );
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.createUser(createUserDto);
  }

  async deleteUser(userId: number) {
    this.userRepository.deleteUser(userId);
  }

  //TODO: UserEntity Update
}
