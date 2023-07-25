import {
  Body,
  Controller,
  Delete,
  Logger,
  Post,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';

@Controller('block')
@UseGuards(AuthGuard())
export class BlockController {
  constructor(private blockService: BlockService) {}

  private logger = new Logger(BlockController.name);

  // @Get()
  // async getBlockList(@GetUser('id') userId: number): Promise<UserProfileDto[]> {
  //   return await this.blockService.getBlockListByFromId(userId);
  // }

  @Delete()
  async deleteBlock(
    @GetUser('id') userId: number,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    await this.blockService.deleteBlock({
      from: userId,
      to: bannedUserId,
    });
  }

  @Post()
  async createBlock(
    @GetUser('id') userId: number,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    userId = 1;
    return await this.blockService.createBlock({
      from: userId,
      to: bannedUserId,
    });
  }
}
