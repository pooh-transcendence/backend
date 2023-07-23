import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from './channel.entity';
import { CreateChannelDto } from './channel.dto';
import { ChannelType } from './channel.entity';
import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class ChannelRepository extends Repository<ChannelEntity> {
  constructor(@InjectRepository(ChannelEntity) private dataSource: DataSource) {
    super(ChannelEntity, dataSource.manager);
  }

  async createChannel(
    ownerId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<ChannelEntity> {
    const { channelType, channelName, password } = createChannelDto;
    let hashedPassword = null;

    if (channelType === ChannelType.PROTECTED) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(password, salt);
    }
    const channel = this.create({
      channelType,
      channelName,
      ownerId,
      password: hashedPassword,
    });

    try {
      this.save(channel);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing username');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return channel;
  }

  async findChannelByChannelName(channelName: string): Promise<ChannelEntity> {
    return await this.findOneBy({ channelName });
  }

  async getAllVisibleChannel(): Promise<ChannelEntity[]> {
    return await this.find({
      where: [
        { channelType: ChannelType.PUBLIC },
        { channelType: ChannelType.PROTECTED },
      ],
      order: { channelName: 'ASC' },
    });
  }

  async isPasswordValid(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async getChannelByChannelId(channelId: number): Promise<ChannelEntity> {
    return this.findOneBy({ id: channelId });
  }
}
