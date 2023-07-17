import { DataSource, Repository } from "typeorm"
import Friend from "./friend.entity"
import { InjectRepository } from "@nestjs/typeorm"


export class FreindRepository extends Repository<Friend>{
    constructor(@InjectRepository(Friend) private datsSource: DataSource) {
        super(Friend, datsSource.manager);
    }

    async createFriend() { }
    // async 
}