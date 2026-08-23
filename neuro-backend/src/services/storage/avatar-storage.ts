import { randomUUID } from 'node:crypto'
import { env } from '@/env/index.js'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase.js'
import { InvalidFileError } from '@/use-cases/_errors/invalid-file-error.js'
import { StorageUploadError } from '@/use-cases/_errors/storage-upload-error.js'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

const MIME_EXTENSION: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

export function validateAvatarFile(file: { mimetype: string; size: number }) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new InvalidFileError('Formato inválido. Envie JPG, PNG, WEBP ou GIF.')
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new InvalidFileError('A imagem deve ter no máximo 2MB.')
    }
}

export async function uploadAvatarToSupabase(params: {
    userId: string
    buffer: Buffer
    mimetype: string
    originalName: string
}) {
    validateAvatarFile({ mimetype: params.mimetype, size: params.buffer.length })

    if (!isSupabaseConfigured()) {
        throw new StorageUploadError('Supabase não está configurado no servidor.')
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
        throw new StorageUploadError('Supabase não está configurado no servidor.')
    }

    const extension = MIME_EXTENSION[params.mimetype] || params.originalName.split('.').pop() || 'jpg'
    const fileName = `${params.userId}/${randomUUID()}.${extension}`
    const bucket = env.SUPABASE_AVATAR_BUCKET

    const { error } = await supabase.storage.from(bucket).upload(fileName, params.buffer, {
        contentType: params.mimetype,
        upsert: false,
    })

    if (error) {
        throw new StorageUploadError(error.message)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return {
        profileImageName: fileName,
        profileImageUrl: data.publicUrl,
    }
}
