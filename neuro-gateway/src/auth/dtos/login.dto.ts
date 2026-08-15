import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Min, MinLength } from "class-validator";

export class LoginDto {
    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }
    @ApiProperty({
        description: 'Email do usuário',
        example: 'user@example.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Senha do usuário',
        example: 'password123',
        minLength: 6
    })
    @IsString()
    @MinLength(6)
    password: string;
}