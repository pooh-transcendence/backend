import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockEntity } from './block.entity';
import { CreateBlockDto } from './block.dto';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('block')
export class BlockController {
  constructor(private blockService: BlockService) {}

  @Get()
  async getAllBlock(): Promise<BlockEntity[]> {
    return this.blockService.getAllBlock();
  }

  @Get('/:userId')
  async getBlockByFromId(
    @Param('userId', ParseIntPipe, PositiveIntPipe) id: number,
  ): Promise<BlockEntity[]> {
    return this.blockService.getBlockByFromId(id);
  }

  @Post()
  async createBlock(
    @Body() createBlockDto: CreateBlockDto,
  ): Promise<BlockEntity> {
    return this.blockService.createBlock(createBlockDto);
  }
}
