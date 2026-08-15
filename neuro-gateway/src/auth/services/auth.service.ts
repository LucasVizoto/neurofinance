import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { serviceConfig } from 'src/config/gateway.config';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { UserSession } from 'src/interfaces/user-session';
import { AuthResponse } from 'src/interfaces/auth-response';

@Injectable()
export class AuthService {
    constructor(
        private readonly httpService: HttpService,
        private readonly jwtService: JwtService
    ) {

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
                    `${serviceConfig.users.url}/login`,
                    loginDto,
                    { timeout: serviceConfig.users.timeout },
                )
            )
            return data;
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials')
        }
    }
    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${serviceConfig.users.url}/auth/register`,
                    registerDto,
                    { timeout: serviceConfig.users.timeout },
                ),
            );
            return data;
        } catch (error) {
            throw new UnauthorizedException('Registration failed')
        }
    }
}
