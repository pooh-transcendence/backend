import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { CreateChannelUserDto } from './channel-user.dto';
import {
  CreateChannelDto,
  UpdateChannelDto,
  UpdateChannelUserDto,
} from './channel.dto';
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class ChannelService {
  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly channelUserRepository: ChannelUserRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private logger = new Logger(ChannelService.name);

  async getAllChannels(): Promise<ChannelEntity[]> {
    return await this.channelRepository.find();
  }

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
      const channelUserDto = new CreateChannelUserDto();
      channelUserDto.userId = userId;
      channelUserDto.channelId = channel.id;
      channelUserDto.password = undefined;
      await this.channelUserRepository.createChannelUser(channelUserDto);
      // user 데이터 필터링
      user.winnerGame = undefined;
      user.loserGame = undefined;
      user.secret = undefined;
      user.socketId = undefined;
      // channelUser 배열에 추가
      channelUser.push(user);
    }
    channel['channelUser'] = channelUser;
    // channel owner를 admin으로 설정
    const channelOwner = await this.channelUserRepository.findChannelUserByIds(
      channel.ownerId,
      channel.id,
    );
    channelOwner.isAdmin = true;
    await this.channelUserRepository.update(channelOwner.id, channelOwner);
    // channel password 제거
    channel.password = undefined;
    return channel;
  }

  async banChannelUser(
    requestUserId: number,
    updateChannelDto: UpdateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId, isBanned } = updateChannelDto;
    // requestUser Admin 여부 검사
    await this.verifyAdminUser(requestUserId, channelId);
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    // ChannelUser 유효성 검사
    await this.verifyTargetUser(channelUser, channelId);
    // ban 처리
    channelUser.isBanned = isBanned || false;
    await this.channelUserRepository.update(channelUser.id, channelUser);
    return channelUser;
  }

  async kickChannelUser(
    requestUserId: number,
    updateChannelDto: CreateChannelUserDto,
  ) {
    const { userId, channelId } = updateChannelDto;
    // requestUser Admin 여부 검사
    await this.verifyAdminUser(requestUserId, channelId);
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    // ChannelUser 유효성 검사
    await this.verifyTargetUser(channelUser, channelId);
    // kick 처리
    await this.channelUserRepository.deleteChannelUserByIds(userId, channelId);
  }

  async getVisibleChannel(): Promise<ChannelEntity[]> {
    const channels = await this.channelRepository.getAllVisibleChannel();
    for (const channel of channels) {
      channel['channelUser'] =
        await this.channelUserRepository.findChannelUserByChannelId(channel.id);
    }
    channels.forEach((channel) => {
      channel.password = undefined;
    });
    return channels;
  }

  async joinChannelUser(
    createChannelUserDto: CreateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId, password } = createChannelUserDto;
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user) throw new NotFoundException();
    await this.verifyChannelForChannelJoin(channelId, password);
    createChannelUserDto.password = undefined;
    return await this.channelUserRepository.createChannelUser(
      createChannelUserDto,
    );
  }

  async leaveChannel(userId: number, channelId: number): Promise<any> {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    this.verifyChannelUserExists(channelUser);
    // channelUser 삭제
    await this.channelUserRepository.deleteChannelUserByIds(userId, channelId);
    // channel user가 0명인 경우 channel 삭제
    const channelUserList =
      await this.channelUserRepository.findChannelUserByChannelId(channelId);
    if (channelUserList.length === 0) {
      await this.channelRepository.deleteChannelByChannelId(channelId);
    }
  }

  async setAdmin(
    requestUserId: number,
    updateChannelDto: CreateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId } = updateChannelDto;
    // owner만 admin 설정 가능
    if (!(await this.isChannelOwner(requestUserId, channelId)))
      throw new HttpException(
        `User ${requestUserId} is not owner in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    // ChannelUser 유효성 검사
    await this.verifyTargetUser(channelUser, channelId);
    // setAdmin 처리
    channelUser.isAdmin = true;
    await this.channelUserRepository.update(channelUser.id, channelUser);
    return channelUser;
  }

  async updatePassword(
    requestUserId: number,
    updateChannelDto: UpdateChannelDto,
  ): Promise<ChannelEntity> {
    const { channelId, password } = updateChannelDto;
    // owner만 password 설정 가능
    if (!(await this.isChannelOwner(requestUserId, channelId)))
      throw new HttpException(
        `User ${requestUserId} is not owner in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
    const channel = await this.getChannelByChannelId(channelId);
    // password가 있다면 password 변경
    if (password) {
      // ChannelType 변경
      channel.channelType = ChannelType.PROTECTED;
      channel.password = password;
    } else {
      // ChannelType 변경
      channel.channelType = ChannelType.PUBLIC;
      channel.password = undefined;
    }
    await this.channelRepository.update(channelId, channel);
    channel.password = undefined;
    return channel;
  }

  // channel 정보 반환
  async getChannelByChannelId(channelId: number): Promise<ChannelEntity> {
    const channel = await this.channelRepository.getChannelByChannelId(
      channelId,
    );
    if (!channel)
      throw new NotFoundException(`There is no Channel ${channelId}`);
    return channel;
  }

  /* Helper Functions */

  // channelUser 검사
  async verifyUserForChannelJoin(user: UserEntity, channelId: number) {
    // User 존재 여부 확인
    if (!user) throw new NotFoundException(`user not found`);
    const userId = user.id;
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    // channelUser가 존재하지 않으면 return
    if (!channelUser) return;
    // channelUser가 이미 banned인지 검사
    this.verifyAlreadyBannedUser(channelUser);
    throw new HttpException(
      `User ${userId} is already joined in Channel ${channelId}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  // channel 검사
  async verifyChannelForChannelJoin(channelId: number, password: string) {
    // Channel 존재 여부 확인
    const channel = await this.getChannelByChannelId(channelId);
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
    this.verifyChannelUserExists(channelUser);
    if (!channelUser.isAdmin)
      throw new HttpException(
        `User ${userId} is not admin in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  async verifyTargetUser(channelUser: ChannelUserEntity, channelId: number) {
    // channelUser 존재 여부 검사
    this.verifyChannelUserExists(channelUser);
    const userId = channelUser.userId;
    // channelUser가 이미 banned인지 검사
    this.verifyAlreadyBannedUser(channelUser);
    // channelUser가 owner가 아닌지 검사
    if (await this.isChannelOwner(userId, channelId))
      throw new HttpException(
        `User ${userId} is owner in Channel ${channelId}`,
        HttpStatus.BAD_REQUEST,
      );
  }

  // channelUser 존재 여부 검사
  verifyChannelUserExists(channelUser: ChannelUserEntity) {
    if (!channelUser) throw new NotFoundException(`channelUser not found`);
  }

  // channelUser가 이미 banned인지 검사
  verifyAlreadyBannedUser(channelUser: ChannelUserEntity) {
    if (channelUser.isBanned)
      throw new HttpException(
        `User ${channelUser.userId} is already banned`,
        HttpStatus.BAD_REQUEST,
      );
  }

  // channel owner 여부 반환
  async isChannelOwner(userId: number, channelId: number): Promise<boolean> {
    const channel = await this.getChannelByChannelId(channelId);
    return channel.ownerId === userId;
  }

  async isUserInChannel(userId: number, channelId: number): Promise<boolean> {
    const result = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!result || result.isBanned) return false;
    return true;
  }

  async getChannellUserSocketByChannelId(channelId: number): Promise<string[]> {
    const channelUser =
      await this.channelUserRepository.findChannelUserByChannelId(channelId);
    const userSocketId = [];
    for (const user of channelUser) {
      userSocketId.push(
        await this.userRepository.findOne({
          where: { id: user.userId },
          select: ['socketId'],
        }),
      );
    }
    return userSocketId;
  }

  async getChannelUser(channelId: number): Promise<ChannelUserEntity[]> {
    return await this.channelUserRepository.findChannelUserByChannelId(
      channelId,
    );
  }

  async getAllChannelUser(): Promise<ChannelUserEntity[]> {
    return await this.channelUserRepository.find();
  }

  async getChannelUserByIds(
    channelId: number,
    userId: number,
  ): Promise<ChannelUserEntity> {
    const channelUser = await this.channelUserRepository.findChannelUserByIds(
      userId,
      channelId,
    );
    if (!channelUser || channelUser.isBanned) return null;
    return channelUser;
  }
}
