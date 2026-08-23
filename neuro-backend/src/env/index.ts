import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    JWT_SECRET: z.string(),
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().default(3333),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_AVATAR_BUCKET: z.string().default('avatars'),
})

const _env = envSchema.safeParse(process.env)

if(_env.success === false){
    console.error('❌ Invalid environment variables', _env.error.format())
    throw new Error('Invalid environment variables')
}

export const env = _env.data