import { DataSource, Repository } from 'typeorm';
import { UserEntity, UserState } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './user.dto';

export class UserRepository extends Repository<UserEntity> {
  constructor(@InjectRepository(UserEntity) private dataSource: DataSource) {
    super(UserEntity, dataSource.manager);
  }

  async getAllUser(): Promise<UserEntity[]> {
    return await this.find({ order: { id: 'ASC' } });
  }

  async getUserByUserId(userId: number): Promise<UserEntity> {
    return await this.findOne({
      where: { id: userId },
      select: { accessToken: false, refreshToken: false },
    });
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
        throw new ConflictException('Existing UserEntity');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return user;
  }

  async deleteUser(userId: number) {
    const result = await this.delete({ id: userId });
    if (result.affected != 0) throw new InternalServerErrorException();
  }

  async updateUserAcessToken(userId: number, accessToken?: string | null) {
    const result = await this.update(
      { id: userId },
      { accessToken: accessToken },
    );
    if (result.affected != 1) throw new InternalServerErrorException();
  }

  async updateUserRefreshToken(userId: number, refreshToken?: string | null) {
    const result = await this.update(
      { id: userId },
      { refreshToken: refreshToken },
    );
    if (result.affected != 1) throw new InternalServerErrorException();
  }

  async updateUserState(userId: number, userState: UserState) {
    const result = await this.update({ id: userId }, { userState: userState });
    if (result.affected != 1) throw new InternalServerErrorException();
  }

  async updateUserElements(userId: number, elements: any) {
    const result = await this.update({ id: userId }, elements);
    if (result.affected != 1) throw new InternalServerErrorException();
  }

  async getUserElementsById(userId: number, elements: any) {
    return this.findOne({ where: { id: userId }, select: elements });
  }
}
