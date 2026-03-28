import type { FastifyRequest, FastifyReply } from 'fastify'
import {z} from 'zod'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeEditUserUseCase } from '@/use-cases/users/composers/make-edit-user-use-case.js'

export async function editUser (request: FastifyRequest, reply: FastifyReply) {
  const editUserBodySchema = z.object({
    zendesk_user_id: z.coerce.number().nullable().optional(), 
    username: z.string().nullable().optional(),
    fullname: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  })

  const parsed = editUserBodySchema.parse(request.body)

  const editUserUseCase = makeEditUserUseCase()
  const userId = Number(request.user.sub)

  const data: {
    userId: number
    zendesk_user_id?: number | null
    username?: string | null
    fullname?: string | null
    email?: string | null
    phone?: string | null
  } = { userId }

  if (parsed.zendesk_user_id !== undefined) {
    data.zendesk_user_id = parsed.zendesk_user_id
  }

  if (parsed.username !== undefined) {
    data.username = parsed.username
  }

  if (parsed.fullname !== undefined) {
    data.fullname = parsed.fullname
  }

  if (parsed.email !== undefined) {
    data.email = parsed.email
  }

  if (parsed.phone !== undefined) {
    data.phone = parsed.phone
  }

  try {
    const {user} = await editUserUseCase.execute(data)
    return reply.status(200).send({
      success: true,
      message: 'The user has been updated',
      user:{
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
