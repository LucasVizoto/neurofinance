import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../services/auth.service";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "src/interfaces/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload) throw new UnauthorizedException('Invalid JWT token');
        const user = await this.authService.validateJwtToken(payload.token);
        if (!user) throw new UnauthorizedException();

        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}