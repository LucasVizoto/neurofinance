import { Controller, Get, Post, Delete, Param, Req, UseGuards, Body } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateChatDto } from '../swagger/swagger.examples';

@ApiTags('Chats')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
    constructor(private readonly proxyService: ProxyService) {}

    @Post()
    @ApiOperation({
        summary: 'Criar novo chat',
        description: 'Cria uma conversa no Postgres + Mongo. O usuário pode ter no máximo 5 chats ativos.',
    })
    @ApiBody({ type: CreateChatDto })
    @ApiResponse({ status: 201, description: 'Chat criado.' })
    @ApiResponse({ status: 400, description: 'Limite de 5 chats atingido.' })
    async createChat(
        @Req() request: Request,
        @Body() body: any,
        @CurrentUser() user: UserInfo,
    ) {
        return this.proxyService.proxyRequest(
            'users',
            'POST',
            '/chats',
            body,
            request.headers as any,
            user,
        );
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Listar chats do usuário', description: 'Retorna as conversas persistidas no serviço de usuários.' })
    async getUserChats(
        @Req() request: Request,
        @Param('userId') userId: string,
        @CurrentUser() user: UserInfo,
    ) {
        return this.proxyService.proxyRequest(
            'users',
            'GET',
            `/chats/user/${userId}`,
            undefined,
            request.headers as any,
            user,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar chat por ID' })
    @ApiResponse({ status: 404, description: 'Chat não encontrado.' })
    async getChatById(
        @Req() request: Request,
        @Param('id') id: string,
        @CurrentUser() user: UserInfo,
    ) {
        return this.proxyService.proxyRequest(
            'users',
            'GET',
            `/chats/${id}`,
            undefined,
            request.headers as any,
            user,
        );
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Excluir chat',
        description: 'Remove a conversa. Esta ação não pode ser desfeita.',
    })
    @ApiResponse({ status: 200, description: 'Chat excluído.' })
    async deleteChat(
        @Req() request: Request,
        @Param('id') id: string,
        @CurrentUser() user: UserInfo,
    ) {
        return this.proxyService.proxyRequest(
            'users',
            'DELETE',
            `/chats/${id}`,
            undefined,
            request.headers as any,
            user,
        );
    }
}
