import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeEditUserUseCase } from '@/use-cases/users/composers/make-edit-user-use-case.js'

export async function editUser(request: FastifyRequest, reply: FastifyReply) {
  const editUserBodySchema = z.object({
    username: z.string().optional(),
    password: z.string().min(6).optional(),
    email: z.string().email().optional(),
    fullname: z.string().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    customColor: z.string().optional(),
    profileImageName: z.string().optional(),
    profileImageUrl: z.string().optional(),
    preferenceTicker: z.string().optional()
  })

  const parsed = editUserBodySchema.parse(request.body)

  const editUserUseCase = makeEditUserUseCase()
  const userId = String(request.user.sub)

  const data: {
    userId: string
    username?: string | null,
    email?: string | null,
    fullname?: string | null,
    cpf?: string | null,
    phone?: string | null,
    customColor?: string | null,
    profileImageName?: string | null,
    profileImageUrl?: string | null,
    preferenceTicker?: string | null
  } = { userId }

  if (parsed.username !== undefined) {
    data.username = parsed.username
  }

  if (parsed.email !== undefined) {
    data.email = parsed.email
  }

  if (parsed.fullname !== undefined) {
    data.fullname = parsed.fullname
  }

  if (parsed.cpf !== undefined) {
    data.cpf = parsed.cpf
  }

  if (parsed.phone !== undefined) {
    data.phone = parsed.phone
  }

  if (parsed.customColor !== undefined) {
    data.customColor = parsed.customColor
  }
  if (parsed.profileImageName !== undefined) {
    data.profileImageName = parsed.profileImageName
  }
  if (parsed.profileImageUrl !== undefined) {
    data.profileImageUrl = parsed.profileImageUrl
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
