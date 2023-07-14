import { IsEmail, IsNotEmpty, isNotEmpty } from "class-validator";

export class updateUserDto
{
    @IsNotEmpty()
    username : string;

    email : string;

    avatar : string;

    friends : string[];
}