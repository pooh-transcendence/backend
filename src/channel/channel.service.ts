import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { CreateChannelUserDto } from './channel-user.dto';
import { ChannelUserEntity } from './channel-user.entity';
import { ChannelUserRepository } from './channel-user.repository';
import {
  CreateChannelDto,
  UpdateChannelDto,
  UpdateChannelUserDto,
} from './channel.dto';
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelRepository } from './channel.repository';
import * as bcrypt from 'bcryptjs';

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
      user.channelSocketId = undefined;
      user.gameSocketId = undefined;
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
    await this.channelUserRepository.update(channelUser.id, {
      isBanned: true,
    });
    return channelUser;
  }

  async kickChannelUser(
    requestUserId: number,
    updateChannelDto: UpdateChannelUserDto,
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

  async getVisibleChannel() {
    const channels = await this.channelRepository.getAllVisibleChannel();
    for (const channel of channels) {
      channel.password = undefined;
      const owner = await this.userRepository.getUserByUserId(channel.ownerId);
      if (owner) {
        channel['ownerNickname'] = owner.nickname; // owner nickname
      }
      channel['channelUser'] =
        await this.channelUserRepository.findChannelUserByChannelId(channel.id);
      channel['userCount'] = channel['channelUser'].length; // channelUser 수
    }
    return channels;
  }

  async joinChannelUser(
    createChannelUserDto: CreateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const { userId, channelId, password } = createChannelUserDto;
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user) throw new NotFoundException();
    await this.verifyChannelForChannelJoin(channelId, password);
    await this.verifyUserForChannelJoin(user, channelId);
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
      return true;
    }
    return false;
  }

  async setAdmin(
    requestUserId: number,
    updateChannelDto: UpdateChannelUserDto,
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
      channel.password = await bcrypt.hash(password, await bcrypt.genSalt());
    } else {
      // ChannelType 변경
      channel.channelType = ChannelType.PUBLIC;
      channel.password = null;
    }
    await this.channelRepository.update(channelId, {
      channelType: channel.channelType,
      password: channel.password,
    });
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
    channel['channelUser'] = await this.getChannelUser(channelId);
    channel['userCount'] = channel['channelUser'].length;
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
    ) {
      throw new HttpException('Password is not valid', HttpStatus.BAD_REQUEST);
    }
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
    if ((await this.isChannelOwner(userId, channelId)) || channelUser.isAdmin)
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
          select: ['channelSocketId'],
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

  async getChannelAdminId(channelId: number): Promise<UserEntity[]> {
    const adminID = await this.channelUserRepository.find({
      where: { channelId: channelId, isAdmin: true },
    });
    const adminUser: UserEntity[] = [];
    for (const admin of adminID) {
      adminUser.push(
        await this.userRepository.findOne({
          where: { id: admin.userId },
          select: ['id', 'nickname', 'avatar'],
        }),
      );
    }
    return adminUser;
  }

  async inviteUserToChannel(
    hostId: number,
    createChannelUserDto: CreateChannelUserDto,
  ): Promise<ChannelUserEntity> {
    const { channelId, userId } = createChannelUserDto;
    const channelUsers = await this.getChannelUser(channelId);
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user) throw new NotFoundException(`There is no User ${userId}`);
    this.verifyChannelUserInChannel(hostId, channelUsers);
    await this.verifyUserForChannelJoin(user, channelId);
    createChannelUserDto.password = undefined;
    return await this.channelUserRepository.createChannelUser(
      createChannelUserDto,
    );
  }

  verifyChannelUserInChannel(
    userId: number,
    channelUsers: ChannelUserEntity[],
  ) {
    let ret = false;
    for (const channelUser of channelUsers) {
      if (channelUser.userId === userId && !channelUser.isBanned) {
        ret = true;
        break;
      }
    }
    if (!ret)
      throw new HttpException(
        `User ${userId} is not in Channel`,
        HttpStatus.BAD_REQUEST,
      );
  }
}
