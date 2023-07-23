import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { BlockService } from 'src/block/block.service';
import { FriendService } from 'src/friend/friend.service';
import { CreateUserDto } from './user.dto';
import { FriendDto } from 'src/friend/friend.dto';
import { ChannelService } from 'src/channel/channel.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private friendService: FriendService,
    private blockService: BlockService,
    private channelService: ChannelService,
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
    user['friends'] = await this.friendService.getFriendListByUserId(userId);
    user['blocks'] = await this.blockService.getBlocListkByUserId(userId);
    user['channels'] = await this.channelService.getChannelByUserId(userId);
    return user;
  }

  async getUserByNickname(nickname: string): Promise<UserEntity> {
    const user = await this.userRepository.getUserByNickname(nickname);
    if (!user)
      throw new HttpException(
        { message: `User with nickname ${nickname} not found` },
        HttpStatus.BAD_REQUEST,
      );
    user['friends'] = await this.friendService.getFriendListByUserId(user.id);
    // user['blocks'] = await this.blockService.getBlocListkByUserId(user.id);
    return user;
  }

  // async getUserByNameAndId(userId: number): Promise<UserProfileDto> {
  //   const user = await this.userRepository.getUserProfileByUserId(userId);
  //   if (!user) throw new NotFoundException(`User with id ${userId} not found`);
  //   return user;
  // }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.createUser(createUserDto);
  }

  async deleteUser(userId: number) {
    this.userRepository.deleteUser(userId);
  }

  async createFriend(createFriendDto: FriendDto) {
    return this.friendService.creatFriend(createFriendDto);
  }

  async deleteFriend(createFriendDto: FriendDto) {
    return this.friendService.deleteFriend(createFriendDto);
  }
  //TODO: UserEntity Update
}
