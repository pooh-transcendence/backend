import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendEntity } from './friend.entity';
import { Logger } from '@nestjs/common';

export class FreindRepository extends Repository<FriendEntity> {
  constructor(@InjectRepository(FriendEntity) private datsSource: DataSource) {
    super(FriendEntity, datsSource.manager);
  }

  private logger = new Logger(FreindRepository.name);

  async createFriend() {
    this.logger.log('createFriend');
  }
}
