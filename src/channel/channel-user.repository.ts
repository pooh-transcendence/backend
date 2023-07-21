import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ClassSerializerInterceptor,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { ChannelEntity } from './channel.entity';
import { CreateChanneUserDto } from './channel-user.dto';

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUserEntity> {
  constructor(
    @InjectRepository(ChannelUserEntity) private dataSource: DataSource,
  ) {
    super(ChannelUserEntity, dataSource.manager);
  }

  async createChannelUser(
    createChannelUserDto: CreateChanneUserDto,
    user: UserEntity,
    channel: ChannelEntity,
  ): Promise<ChannelUserEntity> {
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

  async findChannelUserByUserId(userId: number): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { user: { id: userId } },
      order: { user: { nickName: 'ASC' } },
    });
  }

  async findChannelByChannelId(
    channelId: number,
  ): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { channel: { id: channelId } },
      order: { channel: { channelName: 'ASC' } },
    });
  }

  async findChannelUserByIds(
    userId: number,
    channelId: number,
  ): Promise<ChannelUserEntity> {
    return await this.findOne({
      where: { user: { id: userId }, channel: { id: channelId } },
    });
  }
}
