import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { FriendDto } from './user.dto';
import { FriendEntity } from './friend.entity';
import { FriendRepository } from './friend.respository';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userRepository: UserRepository,
  ) {}

  async creatFriend(createFriendDto: FriendDto): Promise<FriendEntity> {
    const { from, to } = createFriendDto;
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

  async getFriendListByUserId(userId: number): Promise<string[]> {
    const friendId = await this.getFriendByFromId(userId);
    const friends = [];
    for (const id of friendId) {
      friends.push(await this.userRepository.getUserNameAndIdByUserId(id.to));
    }
    return friends;
  }

  async deleteFriend(createFriendDto: FriendDto): Promise<void> {
    const result = await this.friendRepository.delete(createFriendDto);
    if (result.affected === 0)
      throw new NotFoundException('friend deleted not found');
  }
}
