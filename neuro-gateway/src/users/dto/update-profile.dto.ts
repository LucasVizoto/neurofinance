import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
    value === '' || value === null ? undefined : value;

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Lucas Silva' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    @MinLength(2)
    fullname?: string;

    @ApiPropertyOptional({ example: 'lucas' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    @MinLength(2)
    username?: string;

    @ApiPropertyOptional({ example: 'lucas@email.com' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '11999999999' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'AAPL', description: 'Ativo padrão da dashboard' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    preferenceTicker?: string;

    @ApiPropertyOptional({ example: '#A855F7' })
    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    customColor?: string;
}
