import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateMatchDto } from './match.dto';
import { MatchEntity } from './match.entity';

@Controller('game')
export class GameController {
    constructor(private gameService: GameService) { }

    @Post('/match')
    async createMatch(@Body() createMatchDto: CreateMatchDto): Promise<MatchEntity> {
        return await this.gameService.createMatch(createMatchDto);
    }

    @Get('/match')
    async getAllMatch(): Promise<MatchEntity[]> {
        return await this.gameService.getAllMatch();
    }

    @Get('/match/:matchId') // validate
    async getMatchByMatchId(@Param('matchId') matchId: number): Promise<MatchEntity> {
        return await this.gameService.getMatchByMatchId(matchId);
    }

    @Get('/match/userid/:userId') //validate With Id
    async getMatchByUserId(@Param('userId') userId: number): Promise<MatchEntity[]> {
        return await this.gameService.getMatchByUserId(userId);
    }

    @Delete('match/:matchId')
    async getDeleteByMatchId(@Param('matchId') matchId: number) {
        this.gameService.deleteMatchByMatchId(matchId);
    }
}