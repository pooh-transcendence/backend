import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { ChannelEntity } from './channel.entity';

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUserEntity> {
  constructor(
    @InjectRepository(ChannelUserEntity) private dataSource: DataSource,
  ) {
    super(ChannelUserEntity, dataSource.manager);
  }

  async createChannelUser(createChannelUserDto, user: UserEntity, channel: ChannelEntity): Promise<ChannelUserEntity> {
    const { channelId, isAdmin, isBanned } = createChannelUserDto;
    const channelUser = await this.create({ user, channel, isAdmin, isBanned });
    try {
      await this.save(channelUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing user in channel');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return channelUser;
  }

  async findChannelUserByUserId(
    userId: number,
  ): Promise<ChannelUserEntity[]> {
    return await this.findBy({ user: { id: userId } });
  }

  async findChannelByChannelId(
    channelId: number
  ): Promise<ChannelUserEntity[]> {
    return await this.findBy({ channel: { id: channelId } });
  }

  async findOneChannelUserByIds(
    userId: number,
    channelId: number
  ): Promise<ChannelUserEntity> {
    return await this.findOne({ where: { user: { id: userId }, channel: { id: channelId } } })
  }
}
