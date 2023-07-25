import { BlockRepository } from 'src/block/block.repository';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FriendEntity } from './friend.entity';
import { FriendRepository } from './friend.respository';
import { UserRepository } from 'src/user/user.repository';
import { FriendDto } from './friend.dto';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userRepository: UserRepository,
    private blockRepository: BlockRepository,
  ) {}

  private logger = new Logger(FriendService.name);

  async creatFriend(createFriendDto: FriendDto): Promise<FriendEntity> {
    const { from, to } = createFriendDto;
    // validation
    const fromUser = await this.userRepository.findOneBy({ id: from });
    const toUser = await this.userRepository.findOneBy({ id: to });
    if (!fromUser) throw new NotFoundException(`From user ${from} not found`);
    if (!toUser) throw new NotFoundException(`To user ${to} not found`);
    if (from === to)
      throw new NotFoundException('Cannot be friend with yourself');
    if (await this.isFriend(from, to))
      throw new NotFoundException(`Already friend with user ${to}`);
    if (await this.blockRepository.isBlocked(from, to))
      throw new NotFoundException(`Blocked user ${to}`);

    return await this.friendRepository.createFriend(createFriendDto);
  }

  async getFriendListByFromId(id: number): Promise<{ to: number }[]> {
    return await this.friendRepository.getFriendListByFromId(id);
  }

  async getFriendListByToId(id: number): Promise<{ from: number }[]> {
    return await this.friendRepository.getFriendListByToId(id);
  }

  async deleteFriend(createFriendDto: FriendDto) {
    await this.friendRepository.deleteFriend(createFriendDto);
  }

  async isFriend(from: number, to: number): Promise<boolean> {
    const friend = await this.friendRepository.findOneBy({ from, to });
    return friend ? true : false;
  }
}
