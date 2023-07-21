import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';
import { FriendEntity } from './friend.entity';
import { BlockService } from 'src/block/block.service';
import { BlockRepository } from 'src/block/block.repository';
import { BlockEntity } from 'src/block/block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FriendEntity, BlockEntity])],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    FriendRepository,
    FriendService,
    BlockRepository,
    BlockService,
  ],
})
export class UserModule {}
