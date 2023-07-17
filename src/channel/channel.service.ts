import { Body, ConsoleLogger, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ChannelRepository } from './channel.repository';
import { ChannelUserRepository } from './channel-user.repository';
import { CreateChanneUserDto } from './channel-user.dto';
import { CreateChannelDto, UpdateChannelDto } from './channel.dto';
import { ChannelEntity, ChannelType } from './channel.entity';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChannelService {
    constructor(
        //@InjectRepository(Channel)
        private channelRepository: ChannelRepository,
        //@InjectRepository(ChannelUser)
        private channelUserRepository: ChannelUserRepository) { }

    async createChannel(owner: number, createChannelDto: CreateChannelDto, createChannelUserDtoList: CreateChanneUserDto[]): Promise<ChannelEntity> {
        const found = await this.channelRepository.findChannelByChannelName(createChannelDto.channelName);
        if (found)
            throw new HttpException({ reason: "channel is Exist" }, HttpStatus.BAD_REQUEST);
        const channel = await this.channelRepository.createChannel(createChannelDto, owner);
        const ownerChannerUser = { id: owner, channelId: channel.id, isAdmin: true, isBanned: false };
        await this.channelUserRepository.createChannelUser(ownerChannerUser);
        createChannelUserDtoList.forEach(async (createChannelUserDto) => {
            createChannelUserDto.channelId = channel.id;
            await this.channelUserRepository.createChannelUser(createChannelUserDto);
        });
        channel.password = undefined;
        return channel;
    }

    async addChannelUser(createChannelUserDto: CreateChanneUserDto): Promise<ChannelUserEntity> {
        return await this.channelUserRepository.createChannelUser(createChannelUserDto);
    }

    async banChannelUser(updateChannelDto: UpdateChannelDto): Promise<ChannelUserEntity> {
        const { userId, channelId } = updateChannelDto;
        const channelUser = await this.channelUserRepository.findOneChannelUserById(userId, channelId);
        if (!channelId)
            throw new HttpException({ reason: `There is no channelUser ${userId} in Channel ${channelId}` }, HttpStatus.BAD_REQUEST);
        channelUser.isBanned = true;
        return await this.channelUserRepository.save(channelUser);
    }

    async kickChannelUser(updateChannelDto: UpdateChannelDto) {
        const { userId, channelId } = updateChannelDto;
        const channelUser = await this.channelUserRepository.findOneChannelUserById(userId, channelId);
        if (!channelId)
            throw new HttpException({ reason: `There is no channelUser ${userId} in Channel ${channelId}` }, HttpStatus.BAD_REQUEST);
        const result = await this.channelUserRepository.delete({ userId, channelId });
        if (result.affected === 0)
            throw new HttpException(`Cannot delete User ${userId}`, HttpStatus.BAD_REQUEST);
        return channelUser;
    }

    async getVisualChannel(): Promise<ChannelEntity[]> {
        const found = await this.channelRepository.getAllVisualChannel();
        found.forEach((channel) => { channel.password = undefined; });
        return found;
    }

    async joinChannelUser(createChannelUserDto: CreateChanneUserDto): Promise<ChannelUserEntity> {
        const { userId, channelId, password } = createChannelUserDto;
        const channel = await this.channelRepository.findOneBy({ id: channelId });
        const user = await this.channelUserRepository.findOneBy({ userId, channelId });
        if (!channel || channel.channelType == ChannelType.PRIVATE)
            throw new NotFoundException(`There is no Channel ${channelId}`);
        if (user)
            throw new HttpException({ reason: 'user is in user or banned' }, HttpStatus.BAD_GATEWAY);
        if (channel.channelType === ChannelType.PROTECTED && !(await this.channelRepository.isPasswordRight(password, channel.password)))
            throw new HttpException({ reason: 'password Failed' }, HttpStatus.BAD_REQUEST);
        createChannelUserDto.password = undefined;
        return await this.addChannelUser(createChannelUserDto);
    }
}
