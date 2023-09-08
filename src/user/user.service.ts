import { ChannelUserRepository } from 'src/channel/channel-user.repository';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserEntity, UserState, UserType } from './user.entity';
import { BlockService } from 'src/block/block.service';
import { FriendService } from 'src/friend/friend.service';
import { CreateUserDto, UserProfileDto } from './user.dto';
import { ChannelService } from 'src/channel/channel.service';
import { ChannelEntity } from 'src/channel/channel.entity';
import * as fs from 'fs';
import * as path from 'path';

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
  private dirPath = path.join(
    __dirname,
    '..',
    '..',
    'public',
    'user',
    'avatar',
  );

  async getAllUser(): Promise<UserEntity[]> {
    const result = await this.userRepository.getAllUser();
    result.forEach((user) => {
      if (user.avatar && user.avatar.substring(0, 4) !== 'data') {
        const file = user.avatar.split('.');
        user.avatar = fs.readFileSync(user.avatar).toString('base64');
        user.avatar = 'data:' + 'image/' + file[1] + ';base64,' + user.avatar;
      }
    });
    return result;
  }

  async userEntityToUserType(_user: UserEntity): Promise<UserType> {
    const user: UserType = {
      ..._user,
      channels: [],
      friends: [],
      blocks: [],
    };
    user.friends = await this.getFriendListByUserId(_user.id);
    user.blocks = await this.getBlockListByUserId(_user.id);
    user.channels = await this.getChannelListByUserId(_user.id);
    user.friends.forEach((friend) => {
      if (friend.avatar && friend.avatar.substring(0, 4) !== 'data') {
        const file = friend.avatar.split('.');
        friend.avatar = fs.readFileSync(friend.avatar).toString('base64');
        friend.avatar =
          'data:' + 'image/' + file[1] + ';base64,' + friend.avatar;
      }
    });

    user.blocks.forEach((friend) => {
      if (friend.avatar && friend.avatar.substring(0, 4) !== 'data') {
        const file = friend.avatar.split('.');
        friend.avatar = fs.readFileSync(friend.avatar).toString('base64');
        friend.avatar =
          'data:' + 'image/' + file[1] + ';base64,' + friend.avatar;
      }
    });
    return user;
  }

  async getUserById(userId: number): Promise<UserType> {
    const user = await this.userRepository.getUserByUserId(userId);
    if (!user)
      throw new NotFoundException(`There is no user with id ${userId}`);
    return await this.userEntityToUserType(user);
  }

  async getUserByNickname(nickname: string): Promise<UserEntity> {
    const user = await this.userRepository.getUserByNickname(nickname);
    if (!user)
      throw new NotFoundException(`There is no user with nickname ${nickname}`);
    if (user.avatar && user.avatar.substring(0, 4) !== 'data') {
      const file = user.avatar.split('.');
      user.avatar = fs.readFileSync(user.avatar).toString('base64');
      user.avatar = 'data:' + 'image/' + file[1] + ';base64,' + user.avatar;
    }
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
      // channel에 속한 유저 정보
      const userCount =
        await this.channelUserRepository.countChannelUserByChannelId(
          channel.id,
        );
      channel['userCount'] = userCount;
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
    const result = await this.userRepository.updateUserElements(
      userId,
      elements,
    );
    return result;
  }

  async getUserElementsById(userId: number, elements: any): Promise<any> {
    const result = await this.userRepository.getUserElementsById(
      userId,
      elements,
    );
    if (!result)
      throw new NotFoundException(`There is no user with id ${userId}`);
    if (result.avatar && result.avatar.substring(0, 4) !== 'data') {
      const file = result.avatar.split('.');
      result.avatar = fs.readFileSync(result.avatar).toString('base64');
      result.avatar = 'data:' + 'image/' + file[1] + ';base64,' + result.avatar;
    }
    return result;
  }

  private async convertUserEntityToDto(
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

    if (
      userProfileDto.avatar &&
      userProfileDto.avatar.substring(0, 4) !== 'data'
    ) {
      const file = userProfileDto.avatar.split('.');
      userProfileDto.avatar = fs
        .readFileSync(userProfileDto.avatar)
        .toString('base64');
      userProfileDto.avatar =
        'data:' + 'image/' + file[1] + ';base64,' + userProfileDto.avatar;
    }

    return userProfileDto;
  }

  async updateUserAvatar(user: UserType, file: Express.Multer.File) {
    const dirPath = path.join(this.dirPath, user.id.toString());
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    const type = file.mimetype.split('/')[1];
    const filePath = path.join(dirPath, 'avatar.' + type);
    fs.writeFileSync(filePath, file.buffer);
    return await this.updateUserElements(user.id, {
      avatar: filePath,
    });
  }

  async getUserAvatar(url: string) {
    url = path.join(this.dirPath, url);
    const type = url.split('.')[1];
    if (fs.existsSync(url))
      return (
        'data:image/' +
        type +
        ';base64,' +
        fs.readFileSync(url).toString(`base64`)
      );
    return null;
  }
  //TODO: UserEntity Update
}
