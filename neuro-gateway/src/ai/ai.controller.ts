import { Controller, Post, Delete, Req, UseGuards, Body, Get, Param } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AI & Machine Learning')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly proxyService: ProxyService) {}

    @Post('predict')
    @ApiOperation({ summary: 'Previsão ML bruta para um ativo (sem Gemini)' })
    async handlePredict(@Req() request: Request, @Body() body: any, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            '/predict',
            body,
            request.headers as any,
            user,
        );
    }

    @Post('analyze')
    @ApiOperation({ summary: 'Análise completa: ML + Gemini com JSON estruturado' })
    async handleAnalyze(@Req() request: Request, @Body() body: any, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            '/analyze',
            body,
            request.headers as any,
            user,
        );
    }

    @Post('chat')
    @ApiOperation({ summary: 'Enviar mensagem ao agente conversacional (LangChain + Gemini)' })
    async handleChat(@Req() request: Request, @Body() body: any, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            '/chat',
            body,
            request.headers as any,
            user,
        );
    }

    @Get('chat/:mongoId')
    @ApiOperation({ summary: 'Recuperar histórico de mensagens de um chat (MongoDB)' })
    async getChatHistory(
        @Req() request: Request,
        @Param('mongoId') mongoId: string,
        @CurrentUser() user: UserInfo,
    ) {
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            `/chat/${mongoId}`,
            undefined,
            request.headers as any,
            user,
        );
    }

    @Get('dashboard/quotes')
    @ApiOperation({ summary: 'Cotações globais (USD, EUR, Ouro, Prata) via Alpha Vantage' })
    async getDashboardQuotes(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/quotes');
    }

    @Get('dashboard/growth')
    @ApiOperation({ summary: 'Histórico mensal de crescimento (TIME_SERIES_MONTHLY)' })
    async getDashboardGrowth(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/growth');
    }

    @Get('dashboard/valuations')
    @ApiOperation({ summary: 'Top 5 valuations (OVERVIEW / mock cacheado)' })
    async getDashboardValuations(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/valuations');
    }

    @Get('dashboard/news')
    @ApiOperation({ summary: 'Feed de notícias NEWS_SENTIMENT (cache Mongo)' })
    async getDashboardNews(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/news');
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Dados de mercado para o dashboard (yfinance)' })
    async getDashboard(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard');
    }

    private proxyAiGet(request: Request, user: UserInfo, path: string) {
        const queryIndex = request.originalUrl.indexOf('?');
        const query = queryIndex >= 0 ? request.originalUrl.slice(queryIndex) : '';
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            `${path}${query}`,
            undefined,
            request.headers as any,
            user,
        );
    }
}
