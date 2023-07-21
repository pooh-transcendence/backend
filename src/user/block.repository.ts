import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BlockEntity } from './block.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBlockDto } from './block.dto';

@Injectable()
export class BlockRepository extends Repository<BlockEntity> {
  constructor(@InjectRepository(BlockEntity) private dataSource: DataSource) {
    super(BlockEntity, dataSource.manager);
  }

  async createBlock(createBlockDto: CreateBlockDto): Promise<BlockEntity> {
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

  async deleteBlock(deleteBlock: CreateBlockDto): Promise<void> {
    const result = await this.delete(deleteBlock);
    if ((await result).affected === 0)
      throw new NotFoundException(`Couldn't find Block ${deleteBlock} `);
  }

  async getBlockByFromId(from: number): Promise<{ to: number }[]> {
    return await this.find({
      where: { from },
      order: { id: 'DESC' },
      select: ['to'],
    });
  }

  async getAllBlock(): Promise<BlockEntity[]> {
    return await this.find({ order: { id: 'DESC' } });
  }
}
