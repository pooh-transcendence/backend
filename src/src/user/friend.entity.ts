import internal from "stream";
import { BaseEntity, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export default class Friend extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    from: number;

    @Column()
    to: number;
};