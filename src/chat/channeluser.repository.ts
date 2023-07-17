import { DataSource, EntityRepository, Repository } from "typeorm";
import { ChannelUser } from "./channeluser.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";

@Injectable()
export class ChannelUserRepository extends Repository<ChannelUser>{
    constructor(@InjectRepository(ChannelUser) private dataSource: DataSource) {
        super(ChannelUser, dataSource.manager);
    }

    async createChannelUser(createChannelUserDto): Promise<ChannelUser> {
        const { userId, channelId, isAdmin, isBanned } = createChannelUserDto;
        const user = await this.create({ userId, channelId, isAdmin, isBanned });
        try {
            await this.save(user);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Existing user in channel');
            } else {
                throw new InternalServerErrorException();
            }
        }
        return user;
    }

    async findOneChannelUserById(userId: number, channelId: number): Promise<ChannelUser> {
        const found = await this.findOneBy({ userId, channelId });
        if (!found)
            throw new NotFoundException(`Can't find ${userId} with ${channelId}`);
        return found;
    }

}