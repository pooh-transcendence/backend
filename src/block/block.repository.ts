import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { BlockEntity } from "./block.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateBlockDto } from "./block.dto";



@Injectable()
export class BlockRepository extends Repository<BlockEntity>{
    constructor(@InjectRepository(BlockEntity) private dataSource: DataSource) {
        super(BlockEntity, dataSource.manager);
    }

    async createBlock(createBlockDto: CreateBlockDto): Promise<BlockEntity> {
        const { from, to } = createBlockDto;
        const block = await this.create({ from, to });

        try {
            await this.save(block);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Existing Block');
            }
            else {
                throw new InternalServerErrorException();
            }
        }
        return block;
    }

    async deleteBlock(deleteBlock: CreateBlockDto): Promise<void> {
        const { from, to } = deleteBlock;
        const result = await this.delete({ from, to });
        if ((await result).affected === 0)
            throw new NotFoundException(`Couldn't find Block {${from} ,${to}} `);
    }

    async getBlockByFromId(from: number): Promise<BlockEntity[]> {
        return await this.findBy({ from });
    }

    async getAllBlock(): Promise<BlockEntity[]> {
        return await this.find();
    }
}