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
import { channel } from 'diagnostics_channel';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class ChannelRepository extends Repository<ChannelEntity> {
  constructor(@InjectRepository(ChannelEntity) private dataSource: DataSource) {
    super(ChannelEntity, dataSource.manager);
  }

  async createChannel(
    createChannelDto: CreateChannelDto,
    ownUser: UserEntity,
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
      owner: ownUser,
      password: hashedPassword,
      channelUser: [],
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
    return await this.findBy([
      { channelType: ChannelType.PUBLIC },
      { channelType: ChannelType.PROTECTED },
    ]);
  }

  async isPasswordValid(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    if (password === undefined) password = '';
    return await bcrypt.compare(password, hashedPassword);
  }

  async getChannelByChannelId(channelId: number): Promise<ChannelEntity> {
    return this.findOneBy({ id: channelId });
  }
}
