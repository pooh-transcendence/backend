import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';
import { FriendEntity } from './friend.entity';
import { BlockEntity } from './block.entity';
import { BlockRepository } from './block.repository';
import { BlockService } from './block.service';

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
