import {
  Body,
  ConflictException,
  ConsoleLogger,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { CreateChanneUserDto } from './channel-user.dto';
import { CreateChannelDto, UpdateChannelDto } from './channel.dto';
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class ChannelService {
  constructor(
    //@InjectRepository(Channel)
    private channelRepository: ChannelRepository,
    //@InjectRepository(ChannelUser)
    private channelUserRepository: ChannelUserRepository,
    private userRepository: UserRepository,
  ) {}
  /*
  async createChannel(
    owner: number,
    createChannelDto: CreateChannelDto,
    createChannelUserDtoList: CreateChanneUserDto[],
  ): Promise<ChannelEntity> {
    const found = await this.channelRepository.findChannelByChannelName(
      createChannelDto.channelName,
    );
    if (found)
      throw new HttpException(
        { reason: 'channel is Exist' },
        HttpStatus.BAD_REQUEST,
      );
    const channel = await this.channelRepository.createChannel(
      createChannelDto,
      owner,
    );
    const ownerChannerUser = {
      id: owner,
      channelId: channel.id,
      isAdmin: true,
      isBanned: false,
    };
    await this.channelUserRepository.createChannelUser(ownerChannerUser);
    createChannelUserDtoList.forEach(async (createChannelUserDto) => {
      createChannelUserDto.channelId = channel.id;
      await this.channelUserRepository.createChannelUser(createChannelUserDto);
    });
    channel.password = undefined;
    return channel;
  }*/

  async createChannel(
    ownerId: number,
    createChannelDto: CreateChannelDto,
    createChannelUserDtos: CreateChanneUserDto[],
  ): Promise<ChannelEntity> {
    const ownUser = await this.userRepository.getUserByUserId(ownerId);
    if (!ownUser) throw new NotFoundException('Owner를 못찾음');
    const channel = await this.channelRepository.createChannel(
      createChannelDto,
      ownUser,
    );
    const channelUsers: ChannelUserEntity[] = [];
    for (const createChannelUserDto of createChannelUserDtos) {
      const userId = createChannelUserDto.userId;
      const user = await this.userRepository.getUserByUserId(userId);
      if (!user) throw new NotFoundException(`id ${userId} 를 못찾음`);
      channelUsers.push(
        await this.channelUserRepository.createChannelUser(
          createChannelUserDto,
          user,
          channel,
        ),
      );
    }
    channel.channelUser.push(...channelUsers);
    channel.password = undefined;
    const result = await this.channelRepository.save(channel);
    result.channelUser.forEach(
      (channelUser) => (channelUser.channel = undefined),
    );
    return result;
  }

  async addChannelUser(
    createChannelUserDto: CreateChanneUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId } = createChannelUserDto;
    const user = await this.userRepository.getUserByUserId(userId);
    const channel = await this.channelRepository.getChannelByChannelId(
      channelId,
    );
    if (!user || !channel) throw new NotFoundException();
    const channelUser = await this.channelUserRepository.createChannelUser(
      createChannelUserDto,
      user,
      channel,
    );
    if (!channelUser)
      throw new HttpException(
        { reason: 'channelUser 생성이 안됨' },
        HttpStatus.BAD_REQUEST,
      );
    channel.channelUser.push(channelUser);
    this.channelRepository.save(channel);
    return channelUser;
  }

  async banChannelUser(
    updateChannelDto: UpdateChannelDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId } = updateChannelDto;
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!channelUser) throw new NotFoundException();
    channelUser.isBanned = true;
    return await this.channelUserRepository.save(channelUser);
  }

  async kickChannelUser(updateChannelDto: UpdateChannelDto): Promise<void> {
    const { userId, channelId } = updateChannelDto;
    const result = await this.channelUserRepository.delete({
      user: { id: userId },
      channel: { id: channelId },
    });
    if (result.affected === 0)
      throw new HttpException(
        `Cannot delete User ${userId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  async getVisibleChannel(): Promise<ChannelEntity[]> {
    const found = await this.channelRepository.getAllVisibleChannel();
    found.forEach((channel) => {
      channel.password = undefined;
    });
    return found;
  }

  async joinChannelUser(
    createChannelUserDto: CreateChanneUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId, password } = createChannelUserDto;
    const channel = await this.channelRepository.getChannelByChannelId(
      channelId,
    );
    const user = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!channel || channel.channelType == ChannelType.PRIVATE)
      throw new NotFoundException(`There is no Channel ${channelId}`);
    if (user)
      throw new HttpException(
        { reason: 'user is in user or banned' },
        HttpStatus.BAD_GATEWAY,
      );
    if (
      channel.channelType === ChannelType.PROTECTED &&
      !(await this.channelRepository.isPasswordValid(
        password,
        channel.password,
      ))
    )
      throw new HttpException(
        { reason: 'password Failed' },
        HttpStatus.BAD_REQUEST,
      );
    createChannelUserDto.password = undefined;
    return await this.addChannelUser(createChannelUserDto);
  }
}
