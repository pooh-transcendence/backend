import { IsEmail, IsNotEmpty, isNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    nickName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    ftId: string;

    @IsNotEmpty()
    token: string;
    
}