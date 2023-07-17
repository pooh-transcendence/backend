import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUserEntity> {
  constructor(
    @InjectRepository(ChannelUserEntity) private dataSource: DataSource,
  ) {
    super(ChannelUserEntity, dataSource.manager);
  }

  async createChannelUser(createChannelUserDto): Promise<ChannelUserEntity> {
    const { userId, channelId, isAdmin, isBanned } = createChannelUserDto;
    const user = await this.create({ userId, channelId, isAdmin, isBanned });
    try {
      await this.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing user in channel');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return user;
  }

  async findOneChannelUserById(
    userId: number,
    channelId: number,
  ): Promise<ChannelUserEntity> {
    const found = await this.findOneBy({ userId, channelId });
    if (!found)
      throw new NotFoundException(`Can't find ${userId} with ${channelId}`);
    return found;
  }
}
