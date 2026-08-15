import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeFindChatByUserIdUseCase } from '@/use-cases/chats/composers/make-find-by-user-id-use-case.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'

export async function findByUserId(request: FastifyRequest, reply: FastifyReply) {
    const findByUserIdParamsSchema = z.object({
        userId: z.string().uuid(),
    })

    const { userId } = findByUserIdParamsSchema.parse(request.params)

    try {
        const findChatByUserIdUseCase = makeFindChatByUserIdUseCase()

        const { chats } = await findChatByUserIdUseCase.execute({
            userId,
        })

        return reply.status(200).send({ chats })
    } catch (err) {
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}
