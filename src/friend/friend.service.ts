import { BlockRepository } from 'src/block/block.repository';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FriendEntity } from './friend.entity';
import { FriendRepository } from './friend.respository';
import { UserRepository } from 'src/user/user.repository';
import { FriendDto } from './friend.dto';

@Injectable()
export class FriendService {
  constructor(
    private friendRepository: FriendRepository,
    private userRepository: UserRepository,
    private blockRepository: BlockRepository,
  ) {}

  private logger = new Logger(FriendService.name);

  async creatFriend(createFriendDto: FriendDto): Promise<FriendEntity> {
    const { from, to } = createFriendDto;
    // validation
    const fromUser = await this.userRepository.findOneBy({ id: from });
    const toUser = await this.userRepository.findOneBy({ id: to });
    if (!fromUser) throw new NotFoundException(`fromUser ${from} not found`);
    if (!toUser) throw new NotFoundException(`toUser ${to} not found`);
    if (await this.isFriend(from, to))
      throw new HttpException(
        `Already friend with user ${to}`,
        HttpStatus.BAD_REQUEST,
      );
    if (await this.blockRepository.isBlocked(from, to))
      throw new HttpException(`Blocked user ${to}`, HttpStatus.BAD_REQUEST);

    return await this.friendRepository.createFriend(createFriendDto);
  }

  async getFriendListByFromId(id: number): Promise<{ to: number }[]> {
    return await this.friendRepository.getFriendListByFromId(id);
  }

  async getFriendListByToId(id: number): Promise<{ from: number }[]> {
    return await this.friendRepository.getFriendListByToId(id);
  }

  async deleteFriend(createFriendDto: FriendDto) {
    await this.friendRepository.deleteFriend(createFriendDto);
  }

  async isFriend(from: number, to: number): Promise<boolean> {
    const friend = await this.friendRepository.findOneBy({ from, to });
    return friend ? true : false;
  }
}
