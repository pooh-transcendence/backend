import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockEntity } from './block.entity';
import { BlockController } from './block.controller';
import { BlockRepository } from './block.repository';
import { BlockService } from './block.service';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlockEntity, UserEntity])],
  controllers: [BlockController],
  providers: [BlockRepository, BlockService, UserRepository, UserService],
  exports: [BlockService],
})
export class BlockModule {}
