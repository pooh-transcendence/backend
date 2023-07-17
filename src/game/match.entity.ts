import { User } from "src/user/user.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum GameType {
    ONEVSONE = "1vs1",
    LADDER = "LADDER",
}

@Entity()
export class MatchEntity extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.winnerMatch, {eager : false})
    winner: User;

    @ManyToOne(() => User, user => user.loserMatch, {eager : false})
    loser: User;

    @Column()
    gameType: GameType;

    @Column({ default: 0 })
    winScore: number;

    @Column({ default: 0 })
    loseScore: number;

    @Column({ default: 1 })
    ballSpeed: number;

    @Column({ default: 1 })
    ballCount: number;

    @Column({ default: 1 })
    racketSize: number;

    // @CreateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    // startAt: Date;

    // @UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    // updateAt: Date;
}