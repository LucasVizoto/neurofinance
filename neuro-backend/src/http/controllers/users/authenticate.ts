import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { InvalidCredentialsError } from '@/use-cases/_errors/invalid-credentials-error.js'
import { makeAuthenticateUseCase } from '@/use-cases/users/composers/make-authenticate-use-case.js'
import { DisabledUserError } from '@/use-cases/_errors/disabled-user-error.js'
import { setRefreshCookie, signUserSession } from '@/http/helpers/sign-user-session.js'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authenticateBodySchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    })

    const { email, password } = authenticateBodySchema.parse(request.body)

    try {

        const authenticateUseCase = makeAuthenticateUseCase()

        const { user } = await authenticateUseCase.execute({
            email,
            password
        })

        const { token, refreshToken } = await signUserSession(reply, user.id)

        return setRefreshCookie(reply, refreshToken)
            .status(200)
            .send({
                token,
            })

    } catch (err) {
        if (err instanceof InvalidCredentialsError) {
            return reply.status(400).send({ message: err.message })
        }

        if (err instanceof DisabledUserError) {
            return reply.status(401).send({ message: err.message })
        }

        throw err
    }

}