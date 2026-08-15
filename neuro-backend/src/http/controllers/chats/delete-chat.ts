import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeDeleteChatUseCase } from '@/use-cases/chats/composers/make-delete-chat-use-case.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'

export async function deleteChat(request: FastifyRequest, reply: FastifyReply) {
    const deleteChatParamsSchema = z.object({
        id: z.coerce.number(),
    })

    const { id } = deleteChatParamsSchema.parse(request.params)
    const userId = String(request.user.sub)

    try {
        const deleteChatUseCase = makeDeleteChatUseCase()

        await deleteChatUseCase.execute({
            chatId: id,
            userId,
        })

        return reply.status(204).send()
    } catch (err) {
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}
