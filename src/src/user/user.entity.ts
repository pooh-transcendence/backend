import { BaseEntity, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";


@Entity()
@Unique(['username'])
export class User extends BaseEntity{
    @PrimaryGeneratedColumn()
    id : number;

    @PrimaryColumn()
    username : string;
    
    @Column({nullable : true})
    email : string;

    @Column("text", {array : true, nullable : true, default : []})
    friends : string[];

    @Column({nullable : true})
    avatar : string;
}