import { Module } from '@nestjs/common';
import { BlockController } from './block.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockEntity } from './block.entity';
import { BlockRepository } from './block.repository';
import { BlockService } from './block.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlockEntity])],
  controllers: [BlockController],
  providers: [BlockRepository, BlockService],
})
export class BlockModule {}
