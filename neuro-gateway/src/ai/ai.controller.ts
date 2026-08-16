import { Controller, Post, Req, UseGuards, Body, Get } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('AI & Machine Learning')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
    constructor(private readonly proxyService: ProxyService) {}

    @Post('predict')
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
    
    @Post('chat')
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
    async getChatHistory(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'ai',
            request.method,
            request.originalUrl.replace('/ai', ''),
            undefined,
            request.headers as any,
            user,
        );
    }
}
