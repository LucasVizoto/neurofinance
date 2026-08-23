import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { InvalidFileError } from '@/use-cases/_errors/invalid-file-error.js'
import { StorageUploadError } from '@/use-cases/_errors/storage-upload-error.js'
import { makeEditUserUseCase } from '@/use-cases/users/composers/make-edit-user-use-case.js'
import { uploadAvatarToSupabase } from '@/services/storage/avatar-storage.js'

const profileFieldsSchema = z.object({
    username: z.string().min(2).optional(),
    email: z.string().email().optional(),
    fullname: z.string().min(2).optional(),
    phone: z.string().optional(),
    preferenceTicker: z.string().optional(),
    customColor: z.string().optional(),
})

async function parseProfileRequest(request: FastifyRequest) {
    const contentType = String(request.headers['content-type'] || '')
    const fields: Record<string, string> = {}
    let avatar: { buffer: Buffer; mimetype: string; filename: string } | null = null

    if (contentType.includes('multipart/form-data')) {
        const parts = request.parts()
        for await (const part of parts) {
            if (part.type === 'file') {
                if (part.fieldname === 'avatar') {
                    const buffer = await part.toBuffer()
                    avatar = {
                        buffer,
                        mimetype: part.mimetype,
                        filename: part.filename,
                    }
                } else {
                    await part.toBuffer()
                }
            } else if (typeof part.value === 'string' && part.value.trim() !== '') {
                fields[part.fieldname] = part.value
            }
        }
    } else {
        Object.assign(fields, (request.body as Record<string, string>) || {})
    }

    return { fields: profileFieldsSchema.parse(fields), avatar }
}

export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { fields, avatar } = await parseProfileRequest(request)
        const userId = String(request.user.sub)

        let profileImageUrl: string | undefined
        let profileImageName: string | undefined

        if (avatar) {
            const uploaded = await uploadAvatarToSupabase({
                userId,
                buffer: avatar.buffer,
                mimetype: avatar.mimetype,
                originalName: avatar.filename,
            })
            profileImageUrl = uploaded.profileImageUrl
            profileImageName = uploaded.profileImageName
        }

        const editUserUseCase = makeEditUserUseCase()
        const { user } = await editUserUseCase.execute({
            userId,
            ...fields,
            profileImageUrl,
            profileImageName,
        })

        return reply.status(200).send({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                ...user,
                password: undefined,
            },
        })
    } catch (err) {
        if (err instanceof z.ZodError) {
            return reply.status(400).send({ message: 'Dados inválidos', issues: err.format() })
        }
        if (err instanceof InvalidFileError) {
            return reply.status(400).send({ message: err.message })
        }
        if (err instanceof StorageUploadError) {
            return reply.status(503).send({ message: err.message })
        }
        if (err instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: err.message })
        }
        if ((err as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
            return reply.status(400).send({ message: 'A imagem deve ter no máximo 2MB.' })
        }
        throw err
    }
}
