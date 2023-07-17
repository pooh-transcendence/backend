import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockEntity } from './block.entity';
import { CreateBlockDto } from './block.dto';

@Controller('block')
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Get()
  async getAllBlock(): Promise<BlockEntity[]> {
    return this.blockService.getBlockAll();
  }

  @Get('/:id')
  async getBlockByFromId(@Param('id') id: number): Promise<BlockEntity[]> {
    return this.blockService.getBlockByFromId(id);
  }

  @Post()
  async createBlock(
    @Body() createBlockDto: CreateBlockDto,
  ): Promise<BlockEntity> {
    return this.blockService.createBlock(createBlockDto);
  }
}
