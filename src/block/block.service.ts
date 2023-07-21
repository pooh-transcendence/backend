import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { BlockDto } from './block.dto';
import { BlockEntity } from './block.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class BlockService {
  constructor(
    private blockRepository: BlockRepository,
    private userRepository: UserRepository,
  ) {}

  async createBlock(createBlockDto: BlockDto): Promise<BlockEntity> {
    const { from, to } = createBlockDto;
    // validation
    const fromUser = await this.userRepository.findOneBy({ id: from });
    const toUser = await this.userRepository.findOneBy({ id: to });
    if (!fromUser) throw new NotFoundException('from user not found');
    if (!toUser) throw new NotFoundException('to user not found');

    return await this.blockRepository.createBlock(createBlockDto);
  }

  async deleteBlock(deleteBlockDto: BlockDto) {
    return await this.blockRepository.deleteBlock(deleteBlockDto);
  }

  async getBlocListkByUserId(userId: number): Promise<UserEntity[]> {
    const blockUserId = await this.blockRepository.getBlockByFromId(userId);
    const blockUser = [];
    for (const id of blockUserId) {
      blockUser.push(await this.userRepository.getUserByUserId(id.to));
    }
    return blockUser;
  }

  // // TODO: 필요한가?
  // async getAllBlock(): Promise<BlockEntity[]> {
  //   return this.blockRepository.getAllBlock();
  // }
}
