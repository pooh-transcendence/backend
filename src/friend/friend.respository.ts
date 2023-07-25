import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FriendEntity } from './friend.entity';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FriendDto } from './friend.dto';

export class FriendRepository extends Repository<FriendEntity> {
  constructor(@InjectRepository(FriendEntity) private datsSource: DataSource) {
    super(FriendEntity, datsSource.manager);
  }

  private logger = new Logger(FriendRepository.name);

  async createFriend(createFriendDto: FriendDto): Promise<FriendEntity> {
    const friend = this.create(createFriendDto);
    try {
      await this.save(friend);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing Friend');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return friend;
  }

  async getFriendListByFromId(id: number): Promise<{ to: number }[]> {
    return await this.find({
      where: { from: id },
      select: ['to'],
      order: { to: 'ASC' },
    });
  }

  async getFriendListByToId(id: number): Promise<{ from: number }[]> {
    return await this.find({
      where: { to: id },
      select: ['from'],
      order: { from: 'ASC' },
    });
  }

  async deleteFriend(deleteFriendDto: FriendDto) {
    const result = await this.delete(deleteFriendDto);
    if (result.affected === 0)
      throw new ConflictException(`Friend ${deleteFriendDto} not found`);
  }

  async isFriend(from: number, to: number): Promise<boolean> {
    const friend = await this.findOne({ where: { from, to } });
    if (friend) return true;
    else return false;
  }
}
