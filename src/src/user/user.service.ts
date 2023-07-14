import { ConsoleLogger, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.entity';
import { updateUserDto } from "./update-user.dto";
import { typeOrmConfig } from 'src/configs/typeorm.config';

@Injectable()
export class UserService {
    constructor(private userRepository : UserRepository){}

    async createUser(createUserDto : CreateUserDto){ 
        const {username, email, avatar} = createUserDto;
        console.log(typeOrmConfig.entities);
        /*
        const user = await this.getUserByUserName(username);
        if (user)
            return user;
        */
        const dbUser = await this.userRepository.create({username, email, avatar});
        if (!dbUser)
            return null;
        try{
            console.log("id", dbUser.id); // id 가 증가하는 가?
            await this.userRepository.save(dbUser);
        }catch(error){
            return null;
        }
        return dbUser;
    }

    async getUserByUserName(username : string) : Promise<User> {
        const user = await this.userRepository.findOneBy({username : username});
        if (!user)
            return null;
            //throw new HttpException(`There is no ${username} User`, HttpStatus.ACCEPTED);
        return user;
    }
    //나중에 auth로 빠질 함수임
    async updateUser(updateUserDto : updateUserDto) : Promise<User>{
        const {username, email, avatar, friends} = updateUserDto;
        const user = await this.getUserByUserName(username);
        if (!user)
            return null;
        user.email = email || user.email;
        user.avatar = avatar || user.avatar;
        if (friends)
            user.friends = user.friends.concat(friends.filter((friend) => (!user.friends.includes(friend)))); // 없는 것만  
        try{
            await this.userRepository.save(user);
        }catch{
            return null;
        }
        return user;
    }
}