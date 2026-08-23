import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { DisabledUserError } from '@/use-cases/_errors/disabled-user-error.js'
import { makeAuthenticateGoogleUseCase } from '@/use-cases/users/composers/make-authenticate-google-use-case.js'
import { setRefreshCookie, signUserSession } from '@/http/helpers/sign-user-session.js'

export async function authenticateGoogle(request: FastifyRequest, reply: FastifyReply) {
    const authenticateGoogleBodySchema = z.object({
        googleId: z.string().min(1),
        email: z.string().email(),
        fullname: z.string().min(1),
        profileImageUrl: z.string().url().optional().nullable(),
    })

    const { googleId, email, fullname, profileImageUrl } = authenticateGoogleBodySchema.parse(request.body)

    try {
        const authenticateGoogleUseCase = makeAuthenticateGoogleUseCase()
        const { user } = await authenticateGoogleUseCase.execute({
            googleId,
            email,
            fullname,
            profileImageUrl,
        })

        const { token, refreshToken } = await signUserSession(reply, user.id)

        return setRefreshCookie(reply, refreshToken).status(200).send({ token })
    } catch (err) {
        if (err instanceof DisabledUserError) {
            return reply.status(401).send({ message: err.message })
        }

        throw err
    }
}
