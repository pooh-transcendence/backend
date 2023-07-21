import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';
import { FriendEntity } from './friend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FriendEntity])],
  controllers: [UserController],
  providers: [UserService, UserRepository, FriendRepository, FriendService],
})
export class UserModule {}
