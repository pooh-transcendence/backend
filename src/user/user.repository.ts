import { DataSource, Repository } from "typeorm";
import { User } from "./user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateUserDto } from "./createuser.dto";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";

export class UserRepository extends Repository<User>{
    constructor(@InjectRepository(User) private dataSource: DataSource) {
        super(User, dataSource.manager);
    }

    async getAllUser(): Promise<User[]> {
        return this.find();
    }

    async getUserById(userId: number): Promise<User> {
        return this.findOneBy({ id: userId });
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const { nickName, email, ftId, token } = createUserDto;
        const user = this.create({ nickName, email, ftId, token, winScore: 0, loseScore: 0 });
        try {
            await this.save(user);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Existing user');
            } else {
                throw new InternalServerErrorException();
            }
        }
        return user;
    }

    async deleteUser(userId: number) {
        const result = await this.delete({ id: userId });
        if (result.affected != 0)
            throw new InternalServerErrorException();
    }

    async updateUser() {
    }
}