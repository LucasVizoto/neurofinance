export interface JwtPayload {
    sub: string;
    email: string;
    role: string[];
    token: string;
    iat?: number;
    exp?: number;
}