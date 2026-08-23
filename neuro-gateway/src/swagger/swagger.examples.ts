import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    token: string;
}

export class AnalyzeAssetDto {
    @ApiProperty({ example: 'PETR4.SA', description: 'Ticker no formato Alpha Vantage / Yahoo' })
    ticker: string;

    @ApiPropertyOptional({ description: 'ID Mongo da conversa para persistir a análise' })
    mongo_id?: string;
}

export class ChatMessageDto {
    @ApiProperty({ example: 'Qual o risco de PETR4 hoje?' })
    message: string;

    @ApiPropertyOptional({ description: 'ID Mongo da conversa ativa' })
    mongo_id?: string;
}

export class PredictAssetDto {
    @ApiProperty({ example: 'AAPL' })
    ticker: string;
}

export class CreateChatDto {
    @ApiProperty({ example: 'Nova consulta ao NeuroFinance' })
    initialContext: string;
}
