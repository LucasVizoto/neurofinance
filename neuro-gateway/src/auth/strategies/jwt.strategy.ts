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
        if (!payload || !payload.sub) throw new UnauthorizedException('Invalid JWT token');
        // passport-jwt already verified the token signature. We just extract user info from the payload.
        return { userId: payload.sub, email: payload.email ?? null, role: payload.role ?? null };
    }
}