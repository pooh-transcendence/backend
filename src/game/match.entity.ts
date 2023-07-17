import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export enum GameType {
    ONEVSONE = "1vs1",
    LADDER = "LADDER",
}

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    winner: number;

    @Column({ nullable: true })
    loser: number;

    @Column()
    gameType: GameType;

    @Column({ default: 0 })
    winScore: number;

    @Column({ default: 0 })
    loseScore: number;

    @Column({ nullable: true })
    startTime: Date;

    @Column({ default: 1 })
    ballSpeed: number;

    @Column({ default: 1 })
    ballCount: number;

    @Column({ default: 1 })
    racketSize: number;

    @CreateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    startAt: Date;

    @UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    updateAt: Date;
}