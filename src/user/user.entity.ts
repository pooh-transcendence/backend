import { CommonEntity } from "src/common/common.entity";
import { GameEntity } from "src/game/game.entity";
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

export enum UserState {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
    INGAME = "INGAME",
};

@Entity()
@Unique(['nickName'])
export class UserEntity extends CommonEntity {

    @Column({ nullable: true })
    ftId: string;

    @Column({ nullable: true })
    nickName: string;

    @Column()
    winScore: number;

    @Column()
    loseScore: number;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    userState: UserState;

    @Column({ nullable: true })
    token: string;

    @OneToMany(() => GameEntity, game => game.winner)
    winnerGame: GameEntity[];

    @OneToMany(() => GameEntity, game => game.loser)
    loserGame: GameEntity[];

    /*
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @DeleteDateColumn()
    delete_at: Date;
    */
}