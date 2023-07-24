import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FriendEntity } from './friend.entity';
import { FriendRepository } from './friend.respository';
import { UserRepository } from 'src/user/user.repository';
import { FriendDto } from './friend.dto';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userRepository: UserRepository,
  ) {}

  private logger = new Logger(FriendService.name);

  async creatFriend(createFriendDto: FriendDto): Promise<FriendEntity> {
    const { from, to } = createFriendDto;
    // validation
    const fromUser = await this.userRepository.findOneBy({ id: from });
    const toUser = await this.userRepository.findOneBy({ id: to });
    if (!fromUser) throw new NotFoundException('from user not found');
    if (!toUser) throw new NotFoundException('to user not found');

    return await this.friendRepository.createFriend(createFriendDto);
  }

  async getFriendByFromId(id: number): Promise<{ to: number }[]> {
    return await this.friendRepository.getFriendByFromId(id);
  }

  async getFriendByToId(id: number): Promise<{ from: number }[]> {
    return await this.friendRepository.getFriendByToId(id);
  }

  async getFriendListByUserId(userId: number): Promise<UserEntity[]> {
    const friendId = await this.getFriendByFromId(userId);
    const friends = [];
    for (const id of friendId) {
      friends.push(await this.userRepository.getUserByUserId(id.to));
    }
    return friends;
  }

  async deleteFriend(createFriendDto: FriendDto) {
    await this.friendRepository.deleteFriend(createFriendDto);
  }
}
