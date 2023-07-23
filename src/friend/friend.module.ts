import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';
import { FriendEntity } from './friend.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { BlockService } from 'src/block/block.service';
import { BlockRepository } from 'src/block/block.repository';
import { BlockEntity } from 'src/block/block.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendEntity, UserEntity, BlockEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [FriendController],
  providers: [
    FriendRepository,
    FriendService,
    UserRepository,
    UserService,
    BlockService,
    BlockRepository,
  ],
  exports: [FriendService],
})
export class FriendModule {}
