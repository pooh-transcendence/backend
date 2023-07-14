import { DataSource, EntityRepository, Repository } from "typeorm";
import { User } from "./user.entity";
import { InjectRepository } from "@nestjs/typeorm";

export class UserRepository extends Repository<User>{
    constructor (@InjectRepository(User) private dataSource : DataSource){
        super(User, dataSource.manager);
    } 
}