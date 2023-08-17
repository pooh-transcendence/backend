import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { BlockDto } from './block.dto';
import { BlockEntity } from './block.entity';
import { UserRepository } from 'src/user/user.repository';
import { FriendRepository } from 'src/friend/friend.respository';

@Injectable()
export class BlockService {
  constructor(
    private blockRepository: BlockRepository,
    private userRepository: UserRepository,
    private friendRepository: FriendRepository,
  ) {}

  async createBlock(createBlockDto: BlockDto): Promise<BlockEntity> {
    const { from, to } = createBlockDto;
    // validation
    const fromUser = await this.userRepository.findOneBy({ id: from });
    const toUser = await this.userRepository.findOneBy({ id: to });
    if (!fromUser) throw new NotFoundException(`fromUser ${from} not found`);
    if (!toUser) throw new NotFoundException(`toUser ${to} not found`);
    if (await this.isBlocked(from, to))
      throw new HttpException(
        `Already blocked user ${to}`,
        HttpStatus.BAD_REQUEST,
      );
    if (await this.friendRepository.isFriend(from, to)) {
      this.friendRepository.deleteFriend({ from, to });
    }

    return await this.blockRepository.createBlock(createBlockDto);
  }

  async deleteBlock(deleteBlockDto: BlockDto) {
    const block = await this.blockRepository.findOneBy(deleteBlockDto);
    if (!block) throw new NotFoundException("there's no block to delete");
    return await this.blockRepository.deleteBlock(block);
  }

  async isBlocked(from: number, to: number): Promise<boolean> {
    return await this.blockRepository.isBlocked(from, to);
  }

  async getBlockListByFromId(id: number): Promise<{ to: number }[]> {
    return await this.blockRepository.getBlockListByFromId(id);
  }
}
