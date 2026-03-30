import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeEditUserUseCase } from '@/use-cases/users/composers/make-edit-user-use-case.js'

export async function changeUserPreferences(request: FastifyRequest, reply: FastifyReply) {
    const editUserBodySchema = z.object({
        theme: z.string().optional(),
        customColor: z.string().optional(),
        preferenceTicker: z.string().optional()
    })

    const parsed = editUserBodySchema.parse(request.body)

    const editUserUseCase = makeEditUserUseCase()
    const userId = String(request.user.sub)

    const data: {
        userId: string
        theme?: string | null,
        customColor?: string | null,
        preferenceTicker?: string | null
    } = { userId }

    if (parsed.theme !== undefined) {
        data.theme = parsed.theme
    }
    if (parsed.customColor !== undefined) {
        data.customColor = parsed.customColor
    }
    if (parsed.preferenceTicker !== undefined) {
        data.preferenceTicker = parsed.preferenceTicker
    }

    try {
        const { user } = await editUserUseCase.execute(data)
        return reply.status(200).send({
            success: true,
            message: 'The user has been updated',
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
