import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/services/auth.service';

@Injectable()
export class SessionGuard implements CanActivate {

  constructor(private readonly authService: AuthService) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest(); //obtem o objeto original da request http

    const sessionToken = request.headers['x-session-token']

    if (!sessionToken) {
      throw new UnauthorizedException('Session token is missing');
    };
    try {
      const session = await this.authService.validateSessionToken(sessionToken);
      if (!session.valid || !session.user) {
        throw new UnauthorizedException('Invalid session token');
      }
      request.user = session.user; // Adiciona o usuário à requisição para uso posterior
      return true;

    } catch (error) {
      throw new UnauthorizedException('Invalid session token');
    }
  }
}
