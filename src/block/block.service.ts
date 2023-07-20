import { Injectable } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { CreateBlockDto } from './block.dto';
import { BlockEntity } from './block.entity';

@Injectable()
export class BlockService {
  constructor(private blockRepository: BlockRepository) {}

  async createBlock(createBlockDto: CreateBlockDto): Promise<BlockEntity> {
    return await this.blockRepository.createBlock(createBlockDto);
  }

  async deleteBlock(deleteBlockDto: CreateBlockDto) {
    return await this.blockRepository.deleteBlock(deleteBlockDto);
  }

  async getBlockByFromId(userId: number) {
    const found = await this.blockRepository.getBlockByFromId(userId);
    found.forEach((block) => {
      block.from = undefined;
    });
    return found;
  }

  async getAllBlock(): Promise<BlockEntity[]> {
    return this.blockRepository.getAllBlock();
  }
}
