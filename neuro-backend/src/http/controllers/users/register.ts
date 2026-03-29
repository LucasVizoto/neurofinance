import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { UserAlreadyExistsError } from '@/use-cases/_errors/user-already-exists-error.js'
import { makeRegisterUseCase } from '@/use-cases/users/composers/make-register-use-case.js'

export async function register(request: FastifyRequest, reply: FastifyReply) {
    const registerBodySchema = z.object({
        username: z.string(),
        password: z.string().min(6),
        email: z.string().email(),
        fullname: z.string(),
        cpf: z.string(),
        preferenceTicker: z.string().optional(),
        phone: z.string(),
    })

    const { cpf, fullname, phone, username, email, password } = registerBodySchema.parse(request.body)

    try {

        const registerUseCase = makeRegisterUseCase()

        await registerUseCase.execute({
            fullname,
            username,
            phone,
            cpf,
            status: true,
            customColor: null,
            profileImageName: null,
            profileImageUrl: null,
            preferenceTicker: null,
            email,
            password
        })

        return reply.status(201).send({
            message: 'User registered successfully',
        })

    } catch (err) {
        if (err instanceof UserAlreadyExistsError) {
            return reply.status(409).send({ message: err.message })
        }

        throw err
    }
}