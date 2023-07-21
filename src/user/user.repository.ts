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
    return this.find({ order: { id: 'ASC' } });
  }

  async getUserByUserId(userId: number): Promise<UserEntity> {
    return this.findOneBy({ id: userId });
  }

  async getUserNameAndIdByUserId(userId: number): Promise<UserEntity> {
    return this.findOne({ where: { id: userId }, select: ['nickName', 'id'] });
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { nickName, email, ftId, token } = createUserDto;
    const UserEntity = this.create({
      nickName,
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
