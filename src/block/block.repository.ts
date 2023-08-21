import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BlockEntity } from './block.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockDto } from './block.dto';

@Injectable()
export class BlockRepository extends Repository<BlockEntity> {
  constructor(@InjectRepository(BlockEntity) private dataSource: DataSource) {
    super(BlockEntity, dataSource.manager);
  }

  async createBlock(createBlockDto: BlockDto): Promise<BlockEntity> {
    const block = this.create(createBlockDto);
    try {
      await this.save(block);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing Block');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return block;
  }

  async deleteBlock(deleteBlockDto: BlockDto) {
    const result = await this.delete({
      from: deleteBlockDto.from,
      to: deleteBlockDto.to,
    });
    if (result.affected === 0)
      throw new NotFoundException(`Block ${deleteBlockDto} not found`);
  }

  async getBlockListByFromId(
    from: number,
  ): Promise<{ id: number; to: number }[]> {
    return await this.find({
      where: { from },
      select: ['to'],
    });
  }

  async isBlocked(from: number, to: number): Promise<boolean> {
    const block = await this.findOne({ where: { from, to } });
    return block ? true : false;
  }
}
