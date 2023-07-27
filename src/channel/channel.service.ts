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

  async createChannel(
    createChannelDto: CreateChannelDto,
    createChannelUserIds: number[],
  ): Promise<ChannelEntity> {
    const channel = await this.channelRepository.createChannel(
      createChannelDto,
    );
    const channelUser: UserEntity[] = [];
    for (const userId of createChannelUserIds) {
      // User 유효성 검사
      const user = await this.userRepository.getUserByUserId(userId);
      await this.verifyUserForChannelJoin(user, channel.id);
      // ChannelUser 생성
      const channelUserDto = new CreateChanneUserDto();
      channelUserDto.userId = userId;
      channelUserDto.channelId = channel.id;
      channelUserDto.password = undefined;
      await this.channelUserRepository.createChannelUser(channelUserDto);
      // channelUser 배열에 추가
      channelUser.push(user);
    }
    channel['channelUser'] = channelUser;
    channel.password = undefined;
    return channel;
  }

  async banChannelUser(
    requestUserId: number,
    updateChannelDto: UpdateChannelDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId } = updateChannelDto;
    // requestUser Admin 여부 검사
    await this.verifyAdminUser(requestUserId, updateChannelDto.channelId);
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    // ChannelUser 유효성 검사
    await this.verifyBannedUser(channelUser, channelId);
    // ChannelUser ban
    channelUser.isBanned = true;
    await this.channelUserRepository.update(channelUser.id, channelUser);
    return channelUser;
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
    channels.forEach((channel) => {
      channel.password = undefined;
    });
    return channels;
  }

  async joinChannelUser(
    createChannelUserDto: CreateChanneUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId, password } = createChannelUserDto;
    const user = await this.userRepository.getUserByUserId(userId);
    await this.verifyUserForChannelJoin(user, channelId);
    await this.verifyChannelForChannelJoin(channelId, password);
    createChannelUserDto.password = undefined;
    return await this.channelUserRepository.createChannelUser(
      createChannelUserDto,
    );
  }

  async getChannelListByUserId(userId: number): Promise<ChannelEntity[]> {
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

  async quickLeaveChannel(userId: number, channelId: number): Promise<any> {
    return await this.channelUserRepository.deleteChannelUserByIds(
      userId,
      channelId,
    );
  }

  // channel user 검사
  async verifyUserForChannelJoin(user: UserEntity, channelId: number) {
    if (!user) throw new NotFoundException(`There is no User ${user.id}`);
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      user.id,
      channelId,
    );
    if (!channelUser) return;
    if (channelUser.isBanned)
      throw new HttpException(
        `User ${user.id} is banned in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    throw new HttpException(
      `User ${user.id} already joined in Channel ${channelId}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  // channel 검사
  async verifyChannelForChannelJoin(channelId: number, password: string) {
    // Channel 존재 여부 확인
    const channel = await this.channelRepository.getChannelByChannelId(
      channelId,
    );
    if (!channel || channel.channelType == ChannelType.PRIVATE)
      throw new NotFoundException(`There is no Channel ${channelId}`);
    // ChannelType이 PROTECTED인 경우 password 필수
    if (channel.channelType === ChannelType.PROTECTED && !password) {
      throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
    }
    // ChannelType이 PROTECTED인 경우 password 일치 여부 확인
    if (
      channel.channelType === ChannelType.PROTECTED &&
      !(await this.channelRepository.isPasswordValid(
        password,
        channel.password,
      ))
    )
      throw new HttpException('Password is not valid', HttpStatus.BAD_REQUEST);
  }

  // channel admin user 검사
  async verifyAdminUser(userId: number, channelId: number) {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!channelUser)
      throw new HttpException(
        `User ${userId} is not joined in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    if (!channelUser.isAdmin)
      throw new HttpException(
        `User ${userId} is not admin in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  async verifyBannedUser(channelUser: ChannelUserEntity, channelId: number) {
    // ChannelUser 존재 여부 확인
    if (!channelUser)
      throw new HttpException(
        `User ${channelUser.id} is not joined in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    // ChannelUser가 이미 banned인 경우
    if (channelUser.isBanned)
      throw new HttpException(
        `User ${channelUser.id} is already banned in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    // ChannelUser가 owner인 경우
    const channel = await this.channelRepository.getChannelByChannelId(
      channelId,
    );
    if (channelUser.userId === channel.ownerId)
      throw new HttpException(
        `You cannot ban owner of Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  // async isBannedUser(channelUser: ChannelUserEntity): Promise<boolean> {
  //   if (!channelUser) return false;
  //   return channelUser.isBanned;
  // }

  // async isChannelAdmin(channelUser: ChannelUserEntity): Promise<boolean> {
  //   if (!channelUser) return false;
  //   return channelUser.isAdmin;
  // }
}
