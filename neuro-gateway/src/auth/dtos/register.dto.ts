import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Min, MinLength } from "class-validator";

export enum Role {
    USER = 'user',
    ADMIN = 'admin',
    SELLER = 'seller'
}

export class RegisterDto {
    constructor(email: string, password: string, firstName: string, lastName: string, role: Role) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
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

    @ApiProperty({
        description: 'Primeiro nome do usuário',
        example: 'John'
    })
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'Sobrenome do usuário',
        example: 'Doe'
    })
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'Função do usuário',
        example: 'user',
        enum: ['user', 'admin', 'seller'],
        required: false
    })
    @IsOptional()
    @IsString()
    role?: Role = Role.USER;
}