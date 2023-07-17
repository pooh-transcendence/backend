import { DataSource, EntityRepository, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { MatchEntity } from "./match.entity";
import { CreateMatchDto } from "./match.dto";
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { User } from "src/user/user.entity";

export class MatchRepository extends Repository<MatchEntity>{
    constructor(@InjectRepository(MatchEntity) private dataSource: DataSource) {
        super(MatchEntity, dataSource.manager);
    }

    async createMatch(createMatchDto: CreateMatchDto): Promise<MatchEntity> {
        const match = await this.create(createMatchDto);
        if (!match)
            throw new InternalServerErrorException();
        try {
            await this.save(match);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Existing match');
            }
            else {
                throw new InternalServerErrorException();
            }
        }
        return match;
    }

    async getAllMatch(): Promise<MatchEntity[]> {
        return this.find();
    }

    async getMatchByUserId(userId: number): Promise<MatchEntity[]> {
        return this.find({relations : ['winnerMatch', 'loserMatch']});
    }

    async getMatchByMatchId(matchId: number): Promise<MatchEntity> {
        return this.findOneBy({ id: matchId });
    }

    async deleteMatchByMatchId(matchId: number): Promise<void> {
        const result = await this.delete({ id: matchId });
        if (result.affected === 0)
            throw new NotFoundException(`there is no matchid ${matchId}`);
    }
}