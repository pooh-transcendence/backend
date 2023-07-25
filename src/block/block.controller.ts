import {
  Body,
  Controller,
  Delete,
  Logger,
  Post,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BlockService } from './block.service';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { GetUser } from 'src/auth/get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from 'src/user/user.entity';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';

@Controller('block')
@UseGuards(AuthGuard())
@UseInterceptors(TransformInterceptor)
export class BlockController {
  constructor(private blockService: BlockService) {}

  private logger = new Logger(BlockController.name);

  // @Get()
  // async getBlockList(@GetUser('id') userId: number): Promise<UserProfileDto[]> {
  //   return await this.blockService.getBlockListByFromId(userId);
  // }

  @Delete()
  async deleteBlock(
    @GetUser() user: UserEntity,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    return await this.blockService.deleteBlock({
      from: userId,
      to: bannedUserId,
    });
  }

  @Post()
  async createBlock(
    @GetUser() user: UserEntity,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    return await this.blockService.createBlock({
      from: user.id,
      to: bannedUserId,
    });
  }
}
