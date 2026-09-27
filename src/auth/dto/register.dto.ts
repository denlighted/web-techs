import {IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches} from "class-validator";

export class RegisterRequest{

    @IsEmail({}, { message: "Email must be a valid email address" })
    @IsNotEmpty({message:"Email should not be empty"})
    email:string

    @IsString({message:"Password should be string "})
    @IsNotEmpty({message:"Password should not be empty"})
    @Length(5,100,{message:"Password should be longer than 5 characters and shorter than 100"})
    password:string

    @IsString({message:"First name should be string "})
    @IsNotEmpty({message:"First name should not be empty"})
    @Length(1,100,{message:"First name should be longer than 1 characters and shorter than 100"})
    firstName: string

    @IsString({message:"Last name should be string "})
    @IsNotEmpty({message:"Last name should not be empty"})
    @Length(1,100,{message:"Last name should be longer than 1 characters and shorter than 100"})
    lastName:string

    @IsOptional()
    @IsString()
    @Length(1,15,)
    @Matches(/^\+?\d{10,15}$/, {
        message: "Phone number must start with + and contain 10–15 digits",
    })
    phoneNumber?:string
}