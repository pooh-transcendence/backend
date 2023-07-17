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
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ChannelRepository extends Repository<ChannelEntity> {
  constructor(@InjectRepository(ChannelEntity) private dataSource: DataSource) {
    super(ChannelEntity, dataSource.manager);
  }

  async createChannel(
    createChannelDto: CreateChannelDto,
    owner: number,
  ): Promise<ChannelEntity> {
    const { channelType, channelName, password } = createChannelDto;
    let hashPassword = null;

    if (channelType === ChannelType.PROTECTED) {
      const salt = await bcrypt.genSalt();
      hashPassword = await bcrypt.hash(password, salt);
    }
    const channel = this.create({
      channelType,
      channelName,
      owner,
      password: hashPassword,
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

  async getAllVisualChannel(): Promise<ChannelEntity[]> {
    return await this.findBy([
      { channelType: ChannelType.PUBLIC },
      { channelType: ChannelType.PROTECTED },
    ]);
  }

  async isPasswordRight(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashPassword);
  }
}
