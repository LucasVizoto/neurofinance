import { Controller, Post, Delete, Req, UseGuards, Body, Get, Param } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnalyzeAssetDto, ChatMessageDto, PredictAssetDto } from '../swagger/swagger.examples';

@ApiTags('AI & Machine Learning')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly proxyService: ProxyService) {}

    @Post('predict')
    @ApiOperation({
        summary: 'Predição ML bruta',
        description: 'Executa o modelo quantitativo sem passar pelo Gemini.',
    })
    @ApiBody({ type: PredictAssetDto })
    @ApiResponse({ status: 200, description: 'Predição gerada.' })
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
    @ApiOperation({
        summary: 'Análise estruturada do ativo',
        description: 'Combina ML e Gemini. Envie mongo_id para persistir o resultado no histórico da conversa.',
    })
    @ApiBody({ type: AnalyzeAssetDto })
    @ApiResponse({ status: 200, description: 'Análise gerada e opcionalmente persistida.' })
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
    @ApiOperation({
        summary: 'Mensagem ao agente conversacional',
        description: 'LangChain + Gemini. Use mongo_id da conversa ativa.',
    })
    @ApiBody({ type: ChatMessageDto })
    @ApiResponse({ status: 200, description: 'Resposta do agente.' })
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
    @ApiOperation({
        summary: 'Histórico de uma conversa',
        description: 'Recupera as mensagens persistidas no MongoDB.',
    })
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
    @ApiTags('Dashboard')
    @ApiOperation({
        summary: 'Cotações globais',
        description: 'USD, EUR, ouro e prata via Alpha Vantage, com cache.',
    })
    async getDashboardQuotes(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/quotes');
    }

    @Get('dashboard/growth')
    @ApiTags('Dashboard')
    @ApiOperation({
        summary: 'Crescimento histórico',
        description: 'Série mensal do ticker (TIME_SERIES_MONTHLY).',
    })
    @ApiQuery({ name: 'ticker', required: false, example: 'AAPL' })
    @ApiQuery({ name: 'period', required: false, example: '1M', description: '1D, 1W, 1M, 6M ou 1Y' })
    async getDashboardGrowth(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/growth');
    }

    @Get('dashboard/valuations')
    @ApiTags('Dashboard')
    @ApiOperation({
        summary: 'Top valuations',
        description: 'Ranking de ativos (OVERVIEW) com cache.',
    })
    async getDashboardValuations(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/valuations');
    }

    @Get('dashboard/news')
    @ApiTags('Dashboard')
    @ApiOperation({
        summary: 'Feed de notícias',
        description: 'NEWS_SENTIMENT da Alpha Vantage com cache no Mongo.',
    })
    async getDashboardNews(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyAiGet(request, user, '/dashboard/news');
    }

    @Get('dashboard')
    @ApiTags('Dashboard')
    @ApiOperation({
        summary: 'Painel do ativo',
        description: 'Cotação, volume, overview e histórico para o ticker informado. Sem ticker, o serviço de AI aplica o fallback.',
    })
    @ApiQuery({ name: 'ticker', required: false, example: 'AAPL', description: 'Ativo padrão do perfil no frontend' })
    @ApiQuery({ name: 'period', required: false, example: '1M' })
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
