import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockEntity } from './block.entity';
import { BlockController } from './block.controller';
import { BlockRepository } from './block.repository';
import { BlockService } from './block.service';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { FriendEntity } from 'src/friend/friend.entity';
import { FriendRepository } from 'src/friend/friend.respository';
import { FriendService } from 'src/friend/friend.service';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockEntity, UserEntity, FriendEntity]),
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [BlockController],
  providers: [
    BlockRepository,
    BlockService,
    UserRepository,
    UserService,
    FriendRepository,
    FriendService,
  ],
  exports: [BlockService],
})
export class BlockModule {}
