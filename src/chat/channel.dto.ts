import { ChannelType } from "./channel.entity";

export class CreateChannelDto {
    channelType: ChannelType;
    channelName: string;
    password: string;
}

export class UpdateChannelDto {
    userId: number;
    channelId: number;
}