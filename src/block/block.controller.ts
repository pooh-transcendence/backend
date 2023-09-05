import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { TransformInterceptor } from 'src/common/interceptors/tranform.interceptor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserProfileDto } from 'src/user/user.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { BlockService } from './block.service';

@Controller('block')
@UseGuards(AuthGuard())
@UseInterceptors(TransformInterceptor)
export class BlockController {
  constructor(
    private blockService: BlockService,
    private userSerivce: UserService,
  ) {}

  private logger = new Logger(BlockController.name);

  @Get()
  async getBlockList(@GetUser('id') userId: number): Promise<UserProfileDto[]> {
    const blockIds = await this.blockService.getBlockListByFromId(userId);
    const blockList = [];
    for (const id of blockIds) {
      blockList.push(
        await this.userSerivce.getUserElementsById(id.to, [
          'id, username, avatar',
        ]),
      );
    }
    return blockList;
  }

  @Delete()
  async deleteBlock(
    @GetUser() user: UserEntity,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    if (user.id === bannedUserId)
      throw new HttpException(`Can't unblock yourself`, HttpStatus.BAD_REQUEST);
    const result = await this.blockService.deleteBlock({
      from: user.id,
      to: bannedUserId,
    });
    return result;
  }

  @Post()
  async createBlock(
    @GetUser() user: UserEntity,
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    if (user.id === bannedUserId)
      throw new HttpException(`Can't block yourself`, HttpStatus.BAD_REQUEST);
    return await this.blockService.createBlock({
      from: user.id,
      to: bannedUserId,
    });
  }
}
