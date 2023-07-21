import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendRepository } from './friend.respository';
import { FriendService } from './friend.service';

@Module({
  controllers: [FriendController],
  providers: [FriendRepository, FriendService],
  exports: [FriendService],
})
export class FriendModule {}
