import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { CreateFriendDto, CreateUserDto } from './user.dto';
import { FriendService } from './friend.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private friendService: FriendService,
  ) {}

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
    const friendId = await this.friendService.getFriendByFromId(userId);
    const friends = [];
    for (const id of friendId) {
      friends.push(await this.userRepository.getUserNameAndIdByUserId(id.to));
    }
    user['friends'] = friends;
    return user;
  }

  async getUserByNameAndId(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.getUserNameAndIdByUserId(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.createUser(createUserDto);
  }

  async deleteUser(userId: number) {
    this.userRepository.deleteUser(userId);
  }

  async createFriend(createFriendDto: CreateFriendDto) {
    return this.friendService.creatFriend(createFriendDto);
  }

  async deleteFriend(createFriendDto: CreateFriendDto) {
    return this.friendService.deleteFriend(createFriendDto);
  }
  //TODO: UserEntity Update
}
