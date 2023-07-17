import { CommonEntity } from "src/common/common.entity";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum ChannelType {
    PUBLIC = "PUBLIC",
    PROTECTED = "PROTECTED",
    PRIVATE = "PRIVATE",
}

@Entity()
export class ChannelEntity extends CommonEntity {

    @Column({ nullable: true })
    channelType: ChannelType;

    @Column({ nullable: true })
    channelName: string;

    @Column()
    owner: number;

    @Column({ nullable: true })
    password: string;
}