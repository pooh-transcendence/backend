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
      await this.verifyUserForChannelJoin(userId, channel.id);
      // ChannelUser 생성
      const channelUserDto = new CreateChanneUserDto();
      channelUserDto.userId = userId;
      channelUserDto.channelId = channel.id;
      channelUserDto.password = undefined;
      await this.channelUserRepository.createChannelUser(channelUserDto);
      // channelUser 배열에 추가
      const user = await this.userRepository.getUserByUserId(userId);
      channelUser.push(user);
    }
    channel['channelUser'] = channelUser;
    channel.password = undefined;
    return channel;
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
    await this.verifyUserForChannelJoin(userId, channelId);
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
  async verifyUserForChannelJoin(userId: number, channelId: number) {
    // user 존재 여부 확인
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user) throw new NotFoundException(`There is no User ${userId}`);
    // channel 가입 여부 확인
    if (await this.isChannelUser(userId, channelId))
      throw new HttpException(
        `User ${userId} already joined Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    // Bannded User 여부 확인
    if (await this.isBannedUser(userId, channelId))
      throw new HttpException(
        `User ${userId} is banned in Channel ${channelId}`,
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

  async isChannelUser(userId: number, channelId: number): Promise<boolean> {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    return channelUser ? true : false;
  }

  async isBannedUser(userId: number, channelId: number): Promise<boolean> {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!channelUser) return false;
    return channelUser.isBanned;
  }
}
