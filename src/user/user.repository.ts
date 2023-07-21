import { DataSource, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
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
    return await this.findOneBy({ id: userId });
  }

  async getUserByNickname(nickname: string): Promise<UserEntity> {
    return await this.findOneBy({ nickname: nickname });
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { nickname, email, ftId, token } = createUserDto;
    const UserEntity = this.create({
      nickname,
      email,
      ftId,
      token,
    });
    try {
      await this.save(UserEntity);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Existing UserEntity');
      } else {
        throw new InternalServerErrorException();
      }
    }
    return UserEntity;
  }

  async deleteUser(userId: number) {
    const result = await this.delete({ id: userId });
    if (result.affected != 0) throw new InternalServerErrorException();
  }
}
