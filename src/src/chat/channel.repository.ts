import { DataSource, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "./channel.entity";
import { CreateChannelDto } from "./channel.dto";
import { ChannelType } from "./channel.entity";
import * as bcrypt from 'bcryptjs';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";

@Injectable()
export class ChannelRepository extends Repository<Channel>{
    constructor(@InjectRepository(Channel) private dataSource: DataSource) {
        super(Channel, dataSource.manager);
    }

    async createChannel(createChannelDto: CreateChannelDto, owner: number): Promise<Channel> {
        const { channelType, channelName, password } = createChannelDto;
        let hashPassword = null;

        if (channelType === ChannelType.PROTECTED) {
            const salt = await bcrypt.genSalt();
            hashPassword = await bcrypt.hash(password, salt);
        }
        const channel = this.create({
            channelType,
            channelName,
            owner,
            password: hashPassword
        });

        try {
            this.save(channel);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Existing username');
            } else {
                throw new InternalServerErrorException();
            }
        }
        return channel;
    }
    async findChannelByChannelName(channelName: string): Promise<Channel> {
        return await this.findOneBy({ channelName });
    }

    async getAllVisualChannel(): Promise<Channel[]> {
        return await this.findBy([{ channelType: ChannelType.PUBLIC }, { channelType: ChannelType.PROTECTED }]);
    }

    async isPasswordRight(password: string, hashPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashPassword);
    }
}