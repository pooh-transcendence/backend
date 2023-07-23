import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { UserEntity } from 'src/user/user.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';

@Controller('block')
@UseGuards(AuthGuard())
export class BlockController {
  constructor(private blockService: BlockService) {}

  private logger = new Logger(BlockController.name);

  @Get()
  async getUserBlockList(@GetUser() user: UserEntity): Promise<UserEntity[]> {
    return await this.blockService.getBlocListkByUserId(user.id);
  }

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
    return await this.blockService.createBlock({
      from: userId,
      to: bannedUserId,
    });
  }
}
