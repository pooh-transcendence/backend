import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity, UserState } from './user.entity';
import { BlockService } from 'src/block/block.service';
import { FriendService } from 'src/friend/friend.service';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { ChannelService } from 'src/channel/channel.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private friendService: FriendService,
    private blockService: BlockService,
    private channelService: ChannelService,
  ) {}

  async getAllUser(): Promise<UserEntity[]> {
    return this.userRepository.getAllUser();
  }

  async getUserById(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new HttpException(
        { message: `User with id ${userId} not found` },
        HttpStatus.BAD_REQUEST,
      );
    user['friends'] = await this.getFriendListByUserId(userId);
    user['blocks'] = await this.getBlockListByUserId(userId);
    user['channels'] = await this.channelService.getChannelByUserId(userId);
    return user;
  }

  // async getUserByNickname(nickname: string): Promise<UserEntity> {
  //   const user = await this.userRepository.getUserByNickname(nickname);
  //   if (!user)
  //     throw new HttpException(
  //       { message: `User with nickname ${nickname} not found` },
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   /* 필요한가여?
  //   user['friends'] = await this.friendService.getFriendListByUserId(user.id);
  //   user['blocks'] = await this.blockService.getBlockListkByUserId(user.id);
  //   user['channels'] = await this.channelService.getChannelByUserId(user.id);
  //   */
  //   user.accessToken = undefined;
  //   user.refreshToken = undefined;
  //   return user;
  // }

  async getUserProfileByNickname(
    userId: number,
    nickname: string,
  ): Promise<UserProfileDto> {
    const user = await this.userRepository.getUserByNickname(nickname);
    if (!user)
      throw new HttpException(
        { message: `User with nickname ${nickname} not found` },
        HttpStatus.BAD_REQUEST,
      );
    return await this.convertUserEntityToDto(userId, user);
  }

  async getUserProfileById(userId: number): Promise<UserProfileDto> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new HttpException(
        { message: `User with id ${userId} not found` },
        HttpStatus.BAD_REQUEST,
      );
    return await this.convertUserEntityToDto(userId, user);
  }

  async getFriendListByUserId(userId: number): Promise<UserProfileDto[]> {
    const friendList = await this.friendService.getFriendListByFromId(userId);
    const friends = [];
    for (const id of friendList) {
      friends.push(await this.getUserProfileById(id.to));
    }
    return friends;
  }

  async getBlockListByUserId(userId: number): Promise<UserProfileDto[]> {
    const blockList = await this.blockService.getBlockListByFromId(userId);
    const blockUser = [];
    for (const id of blockList) {
      blockUser.push(await this.getUserProfileById(id.to));
    }
    return blockUser;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.createUser(createUserDto);
  }

  async deleteUser(userId: number) {
    this.userRepository.deleteUser(userId);
  }

  async updateUserAcessToken(userId: number, accessToken: string) {
    return this.userRepository.updateUserAcessToken(userId, accessToken);
  }

  async updateUserReFreshToken(userId: number, refreshToken: string) {
    return this.userRepository.updateUserAcessToken(userId, refreshToken);
  }

  async updateUserState(userId: number, userState: UserState) {
    return this.userRepository.updateUserState(userId, userState);
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
