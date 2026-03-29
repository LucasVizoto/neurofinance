import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserAlreadyExistsError } from '@/use-cases/_errors/user-already-exists-error.js'
import { makeRegisterUseCase } from '@/use-cases/users/composers/make-register-use-case.js'

export async function register(request: FastifyRequest, reply: FastifyReply) {
    const registerBodySchema = z.object({
        zendesk_user_id: z.number(),
        fullname: z.string(),
        phone: z.string(),
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
    })

    const { zendesk_user_id, fullname, phone, username, email, password } = registerBodySchema.parse(request.body)

    try {

        const registerUseCase = makeRegisterUseCase()

        const { user } = await registerUseCase.execute({
            ,
            fullname,
            username,
            phone,
            status: true,
            email,
            password
        })

    return reply.status(201).send({
        ...user,
        password: undefined
    })

} catch (err) {
    if (err instanceof UserAlreadyExistsError) {
        return reply.status(409).send({ message: err.message })
    }

    throw err
}
}