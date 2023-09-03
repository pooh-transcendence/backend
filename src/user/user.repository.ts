import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { UserEntity, UserState } from './user.entity';

export class UserRepository extends Repository<UserEntity> {
  constructor(@InjectRepository(UserEntity) private dataSource: DataSource) {
    super(UserEntity, dataSource.manager);
  }

  async getAllUser(): Promise<UserEntity[]> {
    return await this.find({
      order: { id: 'ASC' },
      select: [
        'id',
        'nickname',
        'avatar',
        'winScore',
        'loseScore',
        'userState',
      ],
    });
  }

  async getUserByUserId(userId: number): Promise<UserEntity> {
    const user = await this.createQueryBuilder('user')
      .select([
        'user.id',
        'user.nickname',
        'user.avatar',
        'user.winScore',
        'user.loseScore',
        'user.userState',
        'user.secret',
        'user.channelSocketId',
        'user.gameSocketId',
      ])
      .leftJoinAndSelect(
        'user.winnerGame',
        'winnerGame',
        'winnerGame.gameStatus = :status',
        { status: 'FINISHED' },
      )
      .leftJoinAndSelect(
        'user.loserGame',
        'loserGame',
        'loserGame.gameStatus = :status',
        { status: 'FINISHED' },
      )
      .leftJoinAndSelect('winnerGame.winner', 'winnerGameWinner')
      .leftJoinAndSelect('winnerGame.loser', 'winnerGameLoser')
      .leftJoinAndSelect('loserGame.winner', 'loserGameWinner')
      .leftJoinAndSelect('loserGame.loser', 'loserGameLoser')
      .where('user.id = :userId', { userId: userId })
      .getOne();
    // console.log('user: ', user);
    return user;
    // return await this.findOne({
    //   where: { id: userId },
    //   select: {
    //     id: true,
    //     nickname: true,
    //     avatar: true,
    //     winScore: true,
    //     loseScore: true,
    //     userState: true,
    //     secret: true,
    //     channelSocketId: true,
    //     gameSocketId: true,
    //     winnerGame: true,
    //     loserGame: true,
    //   },
    //   relations: ['winnerGame', 'loserGame'],
    // });
  }

  async getUserByNickname(nickname: string): Promise<UserEntity> {
    return await this.findOneBy({ nickname: nickname });
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { nickname, email, ftId, token } = createUserDto;
    const user = this.create({
      nickname,
      email,
      ftId,
      token,
    });
    try {
      await this.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
    return user;
  }

  async deleteUser(userId: number) {
    const result = await this.delete({ id: userId });
    if (result.affected !== 1)
      throw new InternalServerErrorException(
        `UserEntity delete failed. UserEntity id: ${userId}`,
      );
  }

  async updateUserAcessToken(userId: number, accessToken?: string | null) {
    const result = await this.update(
      { id: userId },
      { accessToken: accessToken },
    );
    if (result.affected !== 1) throw new InternalServerErrorException();
  }

  async updateUserRefreshToken(userId: number, refreshToken?: string | null) {
    const result = await this.update(
      { id: userId },
      { refreshToken: refreshToken },
    );
    if (result.affected === 0) throw new InternalServerErrorException();
  }

  async updateUserState(userId: number, userState: UserState) {
    const result = await this.update({ id: userId }, { userState: userState });
    if (result.affected === 0) throw new InternalServerErrorException();
  }

  async updateUserElements(userId: number, elements: any) {
    const result = await this.update({ id: userId }, elements);
    if (result.affected === 0) throw new InternalServerErrorException();
  }

  async getUserElementsById(userId: number, elements: any) {
    return await this.findOne({ where: { id: userId }, select: elements });
  }
}
