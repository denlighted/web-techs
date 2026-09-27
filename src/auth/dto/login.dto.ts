
import {IsEmail, IsNotEmpty, IsString, Length} from "class-validator";

export class LoginRequest {


    @IsEmail({}, { message: "Email must be a valid email address" })
    @IsNotEmpty({message:"Email should not be empty"})
    email:string

    @IsString({message:"Password should be string "})
    @IsNotEmpty({message:"Password should not be empty"})
    @Length(5,100,{message:"Password should be longer than 5 characters and shorter than 100"})
    password:string
    

}
