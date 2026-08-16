import { Controller, All, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from '../proxy/service/proxy.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Chats')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
    constructor(private readonly proxyService: ProxyService) {}

    @All('*')
    async handleAll(@Req() request: Request, @CurrentUser() user: UserInfo) {
        // Forward to the users service (neuro-backend) which handles chats
        return this.proxyService.proxyRequest(
            'users',
            request.method,
            request.originalUrl,
            request.body,
            request.headers as any,
            user,
        );
    }
    
    @All('')
    async handleRoot(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'users',
            request.method,
            request.originalUrl,
            request.body,
            request.headers as any,
            user,
        );
    }
}
