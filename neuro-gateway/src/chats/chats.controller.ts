import { Controller, Get, Post, Delete, Param, Req, UseGuards, Body } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chats')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
    constructor(private readonly proxyService: ProxyService) {}

    @Post()
    @ApiOperation({ summary: 'Criar novo chat (máx. 5 por usuário)' })
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
    @ApiOperation({ summary: 'Listar chats de um usuário' })
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
    @ApiOperation({ summary: 'Excluir chat por ID' })
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
