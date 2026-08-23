import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeCreateChatUseCase } from '@/use-cases/chats/composers/make-create-chat-use-case.js'
import { UserHas5ChatsError } from '@/use-cases/_errors/user-has-5-chats-error.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import crypto from 'node:crypto'

export async function createChat(request: FastifyRequest, reply: FastifyReply) {
    const createChatBodySchema = z.object({
        initialContext: z.string(),
    })

    const { initialContext } = createChatBodySchema.parse(request.body)
    
    const userId = String(request.user.sub)
    const mongo_id = crypto.randomBytes(12).toString('hex')

    try {
        const createChatUseCase = makeCreateChatUseCase()

        const { chat } = await createChatUseCase.execute({
            userId,
            mongo_id,
            initialContext,
        })

        return reply.status(201).send({ chat })
    } catch (err) {
        if (err instanceof UserHas5ChatsError) {
            return reply.status(403).send({ message: err.message })
        }

        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }

        throw err
    }
}
