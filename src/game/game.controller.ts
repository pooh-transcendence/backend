import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateMatchDto } from './match.dto';
import { Match } from './match.entity';

@Controller('game')
export class GameController {
    constructor(private gameService: GameService) { }

    @Post('/match')
    async createMatch(@Body() createMatchDto: CreateMatchDto): Promise<Match> {
        return await this.gameService.createMatch(createMatchDto);
    }

    @Get('/match')
    async getAllMatch(): Promise<Match[]> {
        return await this.gameService.getAllMatch();
    }

    @Get('/match/:matchId') // validate
    async getMatchByMatchId(@Param('matchId') matchId: number): Promise<Match> {
        return await this.gameService.getMatchByMatchId(matchId);
    }

    @Get('/match/userid/:userId') //validate With Id
    async getMatchByUserId(@Param('userId') userId: number): Promise<Match[]> {
        return await this.gameService.getMatchByUserId(userId);
    }

    @Delete('match/:matchId')
    async getDeleteByMatchId(@Param('matchId') matchId: number) {
        this.gameService.deleteMatchByMatchId(matchId);
    }
}