import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { FriendEntity } from '../friend/friend.entity';
import { BlockService } from 'src/block/block.service';
import { BlockRepository } from 'src/block/block.repository';
import { BlockEntity } from 'src/block/block.entity';
import { FriendRepository } from 'src/friend/friend.respository';
import { FriendService } from 'src/friend/friend.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, FriendEntity, BlockEntity]),
    AuthModule,
  ],
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
