import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginResponseDto } from '../../swagger/swagger.examples';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../decorators/public.decorator';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login com e-mail e senha',
        description: 'Autentica o usuário e devolve um JWT para as rotas protegidas.',
    })
    @ApiResponse({ status: 200, description: 'Autenticado com sucesso.', type: LoginResponseDto })
    @ApiResponse({ status: 400, description: 'Credenciais inválidas.' })
    @ApiResponse({ status: 401, description: 'Usuário desativado.' })
    @Throttle({ short: { ttl: 60000, limit: 5 } })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @Public()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Cadastro de usuário',
        description: 'Cria uma conta com e-mail, senha, CPF e dados pessoais.',
    })
    @ApiResponse({ status: 201, description: 'Conta criada com sucesso.' })
    @ApiResponse({ status: 400, description: 'Dados de cadastro inválidos.' })
    @ApiResponse({ status: 409, description: 'E-mail, username ou CPF já cadastrado.' })
    @Throttle({ medium: { ttl: 60000, limit: 3 } })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('google')
    @Public()
    @ApiOperation({
        summary: 'Iniciar login com Google',
        description: 'Redireciona para a tela de consentimento OAuth 2.0. O callback autorizado no Console deve ser http://localhost:3005/auth/google/callback.',
    })
    @ApiResponse({ status: 302, description: 'Redireciona para o Google ou de volta ao login em caso de erro.' })
    @Throttle({ short: { ttl: 60000, limit: 10 } })
    async googleAuth(@Res() res: Response) {
        try {
            return res.redirect(this.authService.buildGoogleAuthUrl());
        } catch {
            return res.redirect(`${this.authService.getFrontendUrl()}/login?error=google`);
        }
    }

    @Get('google/callback')
    @Public()
    @ApiOperation({
        summary: 'Callback OAuth do Google',
        description: 'Troca o código de autorização, cria ou vincula o usuário e redireciona o frontend com o JWT.',
    })
    @ApiQuery({ name: 'code', required: false, description: 'Código de autorização devolvido pelo Google' })
    @ApiQuery({ name: 'state', required: false, description: 'State assinado pelo gateway' })
    @ApiQuery({ name: 'error', required: false, description: 'Erro devolvido pelo Google quando o usuário recusa o acesso' })
    @ApiResponse({ status: 302, description: 'Redireciona para /login/callback?token= ou /login?error=google.' })
    @Throttle({ short: { ttl: 60000, limit: 10 } })
    async googleCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') error: string,
        @Res() res: Response,
    ) {
        const frontendUrl = this.authService.getFrontendUrl();

        if (error || !code) {
            return res.redirect(`${frontendUrl}/login?error=google`);
        }

        try {
            const { token } = await this.authService.handleGoogleCallback(code, state);
            return res.redirect(`${frontendUrl}/login/callback?token=${encodeURIComponent(token)}`);
        } catch {
            return res.redirect(`${frontendUrl}/login?error=google`);
        }
    }
}
