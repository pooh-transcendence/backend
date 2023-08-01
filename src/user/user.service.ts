import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity, UserState } from './user.entity';
import { BlockService } from 'src/block/block.service';
import { FriendService } from 'src/friend/friend.service';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelEntity } from 'src/channel/channel.entity';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private friendService: FriendService,
    private blockService: BlockService,
    private channelService: ChannelService,
    private channelUserRepository: ChannelUserRepository,
  ) {}

  logger = new Logger(UserService.name);

  async getAllUser(): Promise<UserEntity[]> {
    return await this.userRepository.getAllUser();
  }

  async getUserById(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new NotFoundException(`There is no user with id ${userId}`);
    user['friends'] = await this.getFriendListByUserId(userId);
    user['blocks'] = await this.getBlockListByUserId(userId);
    user['channels'] = await this.getChannelListByUserId(userId);
    return user;
  }

  async getUserProfileByNickname(
    userId: number,
    nickname: string,
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.getUserByNickname(nickname);
    if (!user)
      throw new NotFoundException(`There is no user with nickname ${nickname}`);
    return await this.convertUserEntityToDto(userId, user);
  }

  async getUserProfileById(
    requestUserId: number,
    userId: number,
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new NotFoundException(`There is no user with id ${userId}`);
    return await this.convertUserEntityToDto(requestUserId, user);
  }

  async getFriendListByUserId(userId: number): Promise<UserEntity[]> {
    const friends = await this.friendService.getFriendListByFromId(userId);
    const friendList = [];
    for (const id of friends) {
      const user = await this.userRepository.getUserByUserId(id.to);
      friendList.push(user);
    }
    return friendList;
  }

  async getBlockListByUserId(userId: number): Promise<UserEntity[]> {
    const blocks = await this.blockService.getBlockListByFromId(userId);
    const blockList = [];
    for (const id of blocks) {
      blockList.push(await this.userRepository.getUserByUserId(id.to));
    }
    return blockList;
  }

  async getChannelListByUserId(userId: number): Promise<ChannelEntity[]> {
    const channelUserList =
      await this.channelUserRepository.findChannelUserByUserId(userId);
    const channelList: ChannelEntity[] = [];
    for (const channelUser of channelUserList) {
      const channel = await this.channelService.getChannelByChannelId(
        channelUser.channelId,
      );
      channel.password = undefined;
      channelList.push(channel);
    }
    return channelList;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return await this.userRepository.createUser(createUserDto);
  }

  async deleteUser(userId: number) {
    return await this.userRepository.deleteUser(userId);
  }

  async updateUserAcessToken(userId: number, accessToken: string) {
    return await this.userRepository.updateUserAcessToken(userId, accessToken);
  }

  async updateUserReFreshToken(userId: number, refreshToken: string) {
    return await this.userRepository.updateUserAcessToken(userId, refreshToken);
  }

  async updateUserState(userId: number, userState: UserState) {
    return await this.userRepository.updateUserState(userId, userState);
  }

  async updateUserElements(userId: number, elements: any) {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new NotFoundException(`There is no user with id ${userId}`);
    return await this.userRepository.updateUserElements(userId, elements);
  }

  async getUserElementsById(userId: number, elements: any): Promise<any> {
    const result = await this.userRepository.getUserElementsById(
      userId,
      elements,
    );
    if (!result)
      throw new NotFoundException(`There is no user with id ${userId}`);
    return result;
  }

  async convertUserEntityToDto(
    fromId: number,
    user: UserEntity,
  ): Promise<UserProfileDto> {
    const [isFriend, isBlocked] = await Promise.all([
      this.friendService.isFriend(fromId, user.id),
      this.blockService.isBlocked(fromId, user.id),
    ]);
    const userProfileDto: UserProfileDto = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      winScore: user.winScore,
      loseScore: user.loseScore,
      userState: user.userState,
      winnerGame: user.winnerGame,
      loserGame: user.loserGame,
      isFriend: isFriend,
      isBlocked: isBlocked,
    };
    return userProfileDto;
  }

  //TODO: UserEntity Update
}
