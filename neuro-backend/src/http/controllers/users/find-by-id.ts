import type { FastifyRequest, FastifyReply } from 'fastify'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeFindByIdUseCase } from '@/use-cases/users/composers/make-find-by-id-use-case.js'

export async function findUserById(request: FastifyRequest, reply: FastifyReply) {
    try {

        const findByIdUseCase = makeFindByIdUseCase()


        const { user } = await findByIdUseCase.execute({
            userId: String(request.user.sub),
        })

        return reply.status(200).send({
            user: {
                ...user,
                password: undefined
            }
        })

    } catch (err) {
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}