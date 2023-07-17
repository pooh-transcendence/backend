import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { Block } from './block.entity';
import { BlockRepository } from './block.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Block]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, BlockRepository]
})
export class UserModule { }
