import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateChanneUserDto } from './channel-user.dto';

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUserEntity> {
  constructor(
    @InjectRepository(ChannelUserEntity) private dataSource: DataSource,
  ) {
    super(ChannelUserEntity, dataSource.manager);
  }

  logger = new Logger(ChannelUserRepository.name);

  async createChannelUser(
    createChannelUserDto: CreateChanneUserDto,
  ): Promise<ChannelUserEntity> {
    const channelUser = this.create(createChannelUserDto);
    try {
      await this.save(channelUser);
    } catch (error) {
      if (error.code === '23505') {
        this.logger.debug(error);
        throw new ConflictException('Existing user in channel');
      } else {
        this.logger.debug(error);
        throw new InternalServerErrorException();
      }
    }
    return channelUser;
  }

  async findChannelUserByUserId(userId: number): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { userId },
    });
  }

  async findChannelUserByChannelId(
    channelId: number,
  ): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { id: channelId },
    });
  }

  async findChannelUserByIds(
    userId: number,
    channelId: number,
  ): Promise<ChannelUserEntity> {
    return await this.findOne({
      where: { channelId, userId },
    });
  }

  async deleteChannelUserByIds(
    userId: number,
    channelId: number,
  ): Promise<any> {
    return await this.delete({
      userId,
      channelId,
    });
  }
}
