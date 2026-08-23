import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpException,
    Put,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserInfo } from '../interfaces/user-info';
import { ProxyService } from '../proxy/service/proxy.service';
import { serviceConfig } from '../config/gateway.config';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
    constructor(
        private readonly proxyService: ProxyService,
        private readonly httpService: HttpService,
    ) {}

    @Get('me')
    @ApiOperation({
        summary: 'Perfil do usuário autenticado',
        description: 'Retorna os dados da conta, incluindo preferenceTicker usado como ativo padrão da dashboard.',
    })
    @ApiResponse({ status: 200, description: 'Perfil carregado.' })
    @ApiResponse({ status: 401, description: 'JWT ausente ou inválido.' })
    async getMe(@Req() request: Request, @CurrentUser() user: UserInfo) {
        return this.proxyService.proxyRequest(
            'users',
            'GET',
            '/me',
            undefined,
            request.headers as any,
            user,
        );
    }

    @Put('users/profile')
    @ApiOperation({
        summary: 'Atualizar perfil e avatar',
        description: 'Aceita JSON ou multipart. Envie preferenceTicker para definir o ativo padrão da dashboard. Avatar: JPG, PNG, WEBP ou GIF até 2MB.',
    })
    @ApiConsumes('multipart/form-data', 'application/json')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fullname: { type: 'string', example: 'Lucas Silva' },
                username: { type: 'string', example: 'lucas' },
                email: { type: 'string', example: 'lucas@email.com' },
                phone: { type: 'string', example: '11999999999' },
                preferenceTicker: { type: 'string', example: 'AAPL' },
                customColor: { type: 'string', example: '#A855F7' },
                avatar: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
    @ApiResponse({ status: 400, description: 'Arquivo ou dados inválidos.' })
    @UseInterceptors(
        FileInterceptor('avatar', {
            limits: { fileSize: MAX_AVATAR_BYTES },
        }),
    )
    async updateProfile(
        @Req() request: Request,
        @Body() body: Record<string, string>,
        @UploadedFile() file: Express.Multer.File | undefined,
        @CurrentUser() user: UserInfo,
    ) {
        if (file) {
            if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
                throw new BadRequestException('Formato inválido. Envie JPG, PNG, WEBP ou GIF.');
            }
            if (file.size > MAX_AVATAR_BYTES) {
                throw new BadRequestException('A imagem deve ter no máximo 2MB.');
            }
        }

        const form = new FormData();
        Object.entries(body || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                form.append(key, String(value));
            }
        });

        if (file) {
            form.append(
                'avatar',
                new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
                file.originalname || 'avatar.jpg',
            );
        }

        const response = await firstValueFrom(
            this.httpService.put(`${serviceConfig.users.url}/users/profile`, form, {
                headers: {
                    Authorization: request.headers.authorization,
                    'x-user-id': user?.userId,
                    'x-user-email': user?.email,
                    'x-user-role': user?.role,
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: serviceConfig.users.timeout,
                validateStatus: () => true,
            }),
        );

        if (response.status >= 400) {
            throw new HttpException(
                response.data || { message: 'Falha ao atualizar o perfil.' },
                response.status,
            );
        }

        return response.data;
    }
}
