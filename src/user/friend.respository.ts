import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendEntity } from './friend.entity';

export class FreindRepository extends Repository<FriendEntity> {
  constructor(@InjectRepository(FriendEntity) private datsSource: DataSource) {
    super(FriendEntity, datsSource.manager);
  }

  async createFriend() {
    console.log('create friend');
  }
  // async
}
