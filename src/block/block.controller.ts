import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { BlockService } from './block.service';
import { CreateBlockDto } from './block.dto';
import { UserEntity } from 'src/user/user.entity';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('block')
export class BlockController {
  constructor(
    private userService: UserService,
    private blockService: BlockService,
  ) {}

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
  ): Promise<void> {
    // TODO: jwt
    const createBlockDto = new CreateBlockDto();
    createBlockDto.from = this.userId; // TODO: jwt 후 this 삭제
    createBlockDto.to = bannedUserId;
    await this.blockService.deleteBlock(createBlockDto);
  }

  @Post()
  async createBlock(
    @Body('bannedUserId', ParseIntPipe, PositiveIntPipe) bannedUserId: number,
  ) {
    // TODO: jwt
    const createBlockDto = new CreateBlockDto();
    createBlockDto.from = this.userId; // TODO: jwt 후 this 삭제
    createBlockDto.to = bannedUserId;
    return await this.blockService.createBlock(createBlockDto);
  }
}
