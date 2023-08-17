import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateChannelUserDto } from './channel-user.dto';

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUserEntity> {
  constructor(
    @InjectRepository(ChannelUserEntity) private dataSource: DataSource,
  ) {
    super(ChannelUserEntity, dataSource.manager);
  }

  logger = new Logger(ChannelUserRepository.name);

  async createChannelUser(
    createChannelUserDto: CreateChannelUserDto,
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
        throw new InternalServerErrorException(error.message);
      }
    }
    return channelUser;
  }

  async findChannelUserByUserId(userId: number): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { userId, isBanned: false },
    });
  }

  async findChannelUserByChannelId(
    channelId: number,
  ): Promise<ChannelUserEntity[]> {
    return await this.find({
      where: { channelId, isBanned: false },
    });
  }

  async findAllChannelUserByChannelId(
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

  async deleteChannelUserByIds(userId: number, channelId: number) {
    const result = await this.delete({
      userId,
      channelId,
    });
    if (!result.affected)
      throw new InternalServerErrorException(
        `ChannelUser delete failed. userId: ${userId}, channelId: ${channelId}`,
      );
  }

  async countChannelUserByChannelId(channelId: number): Promise<number> {
    return await this.count({
      where: { channelId, isBanned: false },
    });
  }
}
