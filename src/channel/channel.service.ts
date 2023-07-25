import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { CreateChanneUserDto } from './channel-user.dto';
import { CreateChannelDto, UpdateChannelDto } from './channel.dto';
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
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
    createChannelDto: CreateChannelDto,
    createChannelUserDtos: CreateChanneUserDto[],
  ): Promise<ChannelEntity> {
    const channel = await this.channelRepository.createChannel(
      createChannelDto,
    );
    /*
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
    */
    const channelUser: UserEntity[] = [];
    for (const createChannelUserDto of createChannelUserDtos) {
      const userId = createChannelUserDto.userId;
      const user = await this.userRepository.getUserByUserId(userId);
      if (!user) throw new NotFoundException(`user ${userId} not found`);
      await this.channelUserRepository.createChannelUser(createChannelUserDto);
      channelUser.push(user);
    }
    channel['channelUser'] = channelUser;
    channel.password = undefined;
    return channel;
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
    );
    if (!channelUser)
      throw new HttpException(
        `Cannot create ChannelUser ${userId}`,
        HttpStatus.BAD_REQUEST,
      );
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
      userId,
      channelId,
    });
    if (result.affected === 0)
      throw new HttpException(
        `Cannot delete User ${userId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  async getVisibleChannel(): Promise<ChannelEntity[]> {
    const channels = await this.channelRepository.getAllVisibleChannel();
    // found.forEach((channel) => { // TODO: password는 exclude이므로 undefined하지 않아도 될 듯?
    //   channel.password = undefined;
    // });
    return channels;
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
        'User is already joined channel',
        HttpStatus.BAD_GATEWAY,
      );
    if (
      channel.channelType === ChannelType.PROTECTED &&
      !(await this.channelRepository.isPasswordValid(
        password,
        channel.password,
      ))
    )
      throw new HttpException('Password is not valid', HttpStatus.BAD_REQUEST);
    // createChannelUserDto.password = undefined; // TODO: password는 DTO에서 exclude 처리
    return await this.addChannelUser(createChannelUserDto);
  }

  async getChannelByUserId(userId: number): Promise<ChannelEntity[]> {
    const channelUserList =
      await this.channelUserRepository.findChannelUserByUserId(userId);
    const channelList: ChannelEntity[] = [];
    for (const channelUser of channelUserList) {
      const channel = await this.channelRepository.getChannelByChannelId(
        channelUser.channelId,
      );
      channel.password = undefined;
      channelList.push(channel);
    }
    return channelList;
  }

  async isChannelUser(userId: number, channelId: number): Promise<boolean> {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    return channelUser ? true : false;
  }

  async quickLeaveChannel(userId: number, channelId: number): Promise<any> {
    return await this.channelUserRepository.deleteChannelUserByIds(
      userId,
      channelId,
    );
  }
}
