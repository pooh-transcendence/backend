import { Injectable } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { CreateBlockDto } from './block.dto';
import { BlockEntity } from './block.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class BlockService {
  constructor(
    private blockRepository: BlockRepository,
    private userRepository: UserRepository,
  ) {}

  async createBlock(createBlockDto: CreateBlockDto): Promise<BlockEntity> {
    return await this.blockRepository.createBlock(createBlockDto);
  }

  async deleteBlock(deleteBlockDto: CreateBlockDto) {
    return await this.blockRepository.deleteBlock(deleteBlockDto);
  }

  async getBlocListkByUserId(userId: number) {
    const blockId = await this.blockRepository.getBlockByFromId(userId);
    const blockUser = [];
    for (const id of blockId) {
      blockUser.push(await this.userRepository.getUserNameAndIdByUserId(id.to));
    }
    return blockUser;
  }

  async getAllBlock(): Promise<BlockEntity[]> {
    return this.blockRepository.getAllBlock();
  }
}
