import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeFindChatByIdUseCase } from '@/use-cases/chats/composers/make-find-by-id-use-case.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'

export async function findById(request: FastifyRequest, reply: FastifyReply) {
    const findByIdParamsSchema = z.object({
        id: z.coerce.number(),
    })

    const { id } = findByIdParamsSchema.parse(request.params)

    try {
        const findChatByIdUseCase = makeFindChatByIdUseCase()

        const { chat } = await findChatByIdUseCase.execute({
            chatId: id,
        })

        return reply.status(200).send({ chat })
    } catch (err) {
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}
