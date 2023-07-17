import { DataSource, EntityRepository, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Match } from "./match.entity";
import { CreateMatchDto } from "./match.dto";
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";

export class MatchRepository extends Repository<Match>{
    constructor(@InjectRepository(Match) private dataSource: DataSource) {
        super(Match, dataSource.manager);
    }

    async createMatch(createMatchDto: CreateMatchDto): Promise<Match> {
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

    async getAllMatch(): Promise<Match[]> {
        return this.find();
    }

    async getMatchByUserId(userId: number): Promise<Match[]> {
        return this.findBy([{ winner: userId }, { loser: userId }]);
    }

    async getMatchByMatchId(matchId: number): Promise<Match> {
        return this.findOneBy({ id: matchId });
    }

    async deleteMatchByMatchId(matchId: number): Promise<void> {
        const result = await this.delete({ id: matchId });
        if (result.affected === 0)
            throw new NotFoundException(`there is no matchid ${matchId}`);
    }
}