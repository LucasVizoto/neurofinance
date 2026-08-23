import { HttpService } from '@nestjs/axios';
import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { serviceConfig } from 'src/config/gateway.config';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { UserSession } from 'src/interfaces/user-session';
import { AuthResponse } from 'src/interfaces/auth-response';

type GoogleTokenResponse = {
    access_token: string
}

type GoogleUserInfo = {
    sub: string
    email: string
    email_verified?: boolean
    name?: string
    picture?: string
}

@Injectable()
export class AuthService {
    constructor(
        private readonly httpService: HttpService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {

    }

    getFrontendUrl() {
        return (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').trim()
    }

    private getGoogleConfig() {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim()
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')?.trim()
        const callbackUrl = (this.configService.get<string>('GOOGLE_CALLBACK_URL')
            || 'http://localhost:3005/auth/google/callback').trim()

        return { clientId, clientSecret, callbackUrl }
    }

    buildGoogleAuthUrl() {
        const { clientId, callbackUrl } = this.getGoogleConfig()

        if (!clientId) {
            throw new ServiceUnavailableException('Google OAuth não configurado')
        }

        const state = this.jwtService.sign(
            { typ: 'google_oauth' },
            { expiresIn: '10m' },
        )

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'select_account',
            state,
        })

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    }

    async handleGoogleCallback(code: string, state?: string) {
        if (state) {
            try {
                const payload = this.jwtService.verify<{ typ?: string }>(state)
                if (payload.typ !== 'google_oauth') {
                    throw new UnauthorizedException('Invalid OAuth state')
                }
            } catch {
                throw new UnauthorizedException('Invalid OAuth state')
            }
        }

        const { clientId, clientSecret, callbackUrl } = this.getGoogleConfig()

        if (!clientId || !clientSecret) {
            throw new ServiceUnavailableException('Google OAuth não configurado')
        }

        const tokenBody = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: callbackUrl,
            grant_type: 'authorization_code',
        })

        const { data: tokenData } = await firstValueFrom(
            this.httpService.post<GoogleTokenResponse>(
                'https://oauth2.googleapis.com/token',
                tokenBody.toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 15000,
                },
            ),
        )

        const { data: profile } = await firstValueFrom(
            this.httpService.get<GoogleUserInfo>(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    timeout: 15000,
                },
            ),
        )

        if (!profile?.sub || !profile?.email) {
            throw new UnauthorizedException('Não foi possível obter o perfil do Google')
        }

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${serviceConfig.users.url}/auth/google`,
                    {
                        googleId: profile.sub,
                        email: profile.email,
                        fullname: profile.name || profile.email.split('@')[0],
                        profileImageUrl: profile.picture || null,
                    },
                    { timeout: serviceConfig.users.timeout },
                ),
            )
            return data as { token: string }
        } catch (error: any) {
            if (error.response) {
                throw new HttpException(error.response.data, error.response.status)
            }
            throw new InternalServerErrorException('Gateway error: ' + error.message)
        }
    }

    async validateJwtToken(token: string): Promise<AuthResponse> {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid JWT token')
        }
    }
    async validateSessionToken(sessionToken: string): Promise<UserSession> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get<UserSession>(
                    `${serviceConfig.users.url}/sessions/validate/${sessionToken}`,
                    { timeout: serviceConfig.users.timeout },
                ),
            );
            return data
        } catch (error) {
            throw new UnauthorizedException('Invalid session token')
        }
    }

    async login(loginDto: LoginDto): Promise<AuthResponse> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${serviceConfig.users.url}/auth`,
                    loginDto,
                    { timeout: serviceConfig.users.timeout },
                )
            )
            return data;
        } catch (error: any) {
            if (error.response) {
                throw new HttpException(error.response.data, error.response.status);
            }
            throw new InternalServerErrorException('Gateway error: ' + error.message);
        }
    }
    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${serviceConfig.users.url}/users`,
                    registerDto,
                    { timeout: serviceConfig.users.timeout },
                ),
            );
            return data;
        } catch (error: any) {
            if (error.response) {
                throw new HttpException(error.response.data, error.response.status);
            }
            throw new InternalServerErrorException('Gateway error: ' + error.message);
        }
    }
}
