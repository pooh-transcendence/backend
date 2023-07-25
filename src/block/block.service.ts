import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockRepository } from './block.repository';
import { BlockDto } from './block.dto';
import { BlockEntity } from './block.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserProfileDto } from 'src/user/user.dto';
import { ApiProperty } from '@nestjs/swagger';

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
    await this.blockRepository.deleteBlock(deleteBlockDto);
  }

  async isBlocked(from: number, to: number): Promise<boolean> {
    return await this.blockRepository.isBlocked(from, to);
  }

  async getBlockListByFromId(id: number): Promise<{ to: number }[]> {
    return await this.blockRepository.getBlockListByFromId(id);
  }

  // // TODO: 필요한가?
  // async getAllBlock(): Promise<BlockEntity[]> {
  //   return this.blockRepository.getAllBlock();
  // }
}
