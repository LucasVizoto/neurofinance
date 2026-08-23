import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeFindChatByMongoIdUseCase } from '@/use-cases/chats/composers/make-find-by-mongo-id-use-case.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'

export async function findByMongoId(request: FastifyRequest, reply: FastifyReply) {
    const findByMongoIdParamsSchema = z.object({
        mongoId: z.string(),
    })

    const { mongoId } = findByMongoIdParamsSchema.parse(request.params)

    try {
        const findChatByMongoIdUseCase = makeFindChatByMongoIdUseCase()

        const { chat } = await findChatByMongoIdUseCase.execute({
            mongoId,
        })

        return reply.status(200).send({ chat })
    } catch (err) {
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}
