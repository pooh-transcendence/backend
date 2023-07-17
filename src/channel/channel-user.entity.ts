import { CommonEntity } from "src/common/common.entity";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class ChannelUserEntity extends CommonEntity {

    @Column({ nullable: true })
    userId: number;

    @Column({ nullable: true })
    channelId: number;

    @Column({ default: false })
    isAdmin: boolean;

    @Column({ default: false })
    isBanned: boolean;
}