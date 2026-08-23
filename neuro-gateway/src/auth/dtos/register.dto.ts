import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export enum Role {
    USER = 'user',
    ADMIN = 'admin',
    SELLER = 'seller'
}

export class RegisterDto {
    constructor(email: string, password: string, username: string, fullname: string, cpf: string, phone: string, role: Role) {
        this.email = email;
        this.password = password;
        this.username = username;
        this.fullname = fullname;
        this.cpf = cpf;
        this.phone = phone;
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
        description: 'Username do usuário',
        example: 'johndoe'
    })
    @IsString()
    username: string;

    @ApiProperty({
        description: 'Nome completo do usuário',
        example: 'John Doe'
    })
    @IsString()
    fullname: string;

    @ApiProperty({
        description: 'CPF do usuário',
        example: '12345678901'
    })
    @IsString()
    cpf: string;

    @ApiProperty({
        description: 'Telefone do usuário',
        example: '11999999999'
    })
    @IsString()
    phone: string;

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