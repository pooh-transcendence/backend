import { Injectable } from '@nestjs/common';
import { MatchRepository } from './match.repository';
import { CreateMatchDto } from './match.dto';
import { Match } from './match.entity';
import { match } from 'assert';

@Injectable()
export class GameService {
    constructor(private matchRepository: MatchRepository) { }

    async createMatch(createMatchDto: CreateMatchDto): Promise<Match> {
        return await this.matchRepository.createMatch(createMatchDto);
    }

    async getAllMatch(): Promise<Match[]> {
        return await this.matchRepository.getAllMatch();
    }

    async getMatchByUserId(userId: number): Promise<Match[]> {
        return await this.matchRepository.getMatchByUserId(userId);
    }

    async getMatchByMatchId(matchId: number): Promise<Match> {
        return await this.matchRepository.getMatchByMatchId(matchId);
    }

    async deleteMatchByMatchId(matchId: number): Promise<void> {
        await this.matchRepository.deleteMatchByMatchId(matchId);
    }
}
