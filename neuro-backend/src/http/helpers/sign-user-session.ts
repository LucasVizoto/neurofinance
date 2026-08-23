import type { FastifyReply } from 'fastify'

export async function signUserSession(reply: FastifyReply, userId: string) {
    const token = await reply.jwtSign(
        {},
        {
            sign: {
                sub: String(userId),
            },
        },
    )

    const refreshToken = await reply.jwtSign(
        {},
        {
            sign: {
                sub: String(userId),
                expiresIn: '7d',
            },
        },
    )

    return { token, refreshToken }
}

export function setRefreshCookie(reply: FastifyReply, refreshToken: string) {
    return reply.setCookie('refreshToken', refreshToken, {
        path: '/',
        secure: true,
        sameSite: true,
        httpOnly: true,
    })
}
