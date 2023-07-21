import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { UserEntity } from 'src/user/user.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('block')
export class BlockController {
  constructor(private blockService: BlockService) {}

  private logger = new Logger(BlockController.name);

  private userId = 1; // TODO: jwt 후 삭제

  @Get()
  async getUserBlockList(): Promise<UserEntity[]> {
    // TODO: jwt
    return await this.blockService.getBlocListkByUserId(this.userId); // TODO: jwt 후 this 삭제
  }

  @Delete()
  async deleteBlock(
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    // TODO: jwt
    await this.blockService.deleteBlock({
      from: this.userId,
      to: bannedUserId,
    });
  }

  @Post()
  async createBlock(
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    // TODO: jwt
    return await this.blockService.createBlock({
      from: this.userId,
      to: bannedUserId,
    });
  }
}
