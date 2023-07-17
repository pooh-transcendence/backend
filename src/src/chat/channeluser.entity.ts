import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class ChannelUser extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: number;

    @Column({ nullable: true })
    channelId: number;

    @Column({ default: false })
    isAdmin: boolean;

    @Column({ default: false })
    isBanned: boolean;
}