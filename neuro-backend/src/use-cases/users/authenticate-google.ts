import { randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import type { Users } from '@/generated/prisma/client.js'
import type { UsersRepository } from '@/repositories/user-repository.js'
import { DisabledUserError } from '../_errors/disabled-user-error.js'

interface AuthenticateGoogleUseCaseRequest {
    googleId: string
    email: string
    fullname: string
    profileImageUrl?: string | null
}

interface AuthenticateGoogleUseCaseResponse {
    user: Users
}

function slugUsername(email: string, fullname: string) {
    const fromEmail = email.split('@')[0] || ''
    const fromName = fullname || ''
    const base = (fromEmail || fromName || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 24)

    return base || 'user'
}

export class AuthenticateGoogleUseCase {
    constructor(private userRepository: UsersRepository) {}

    async execute({
        googleId,
        email,
        fullname,
        profileImageUrl,
    }: AuthenticateGoogleUseCaseRequest): Promise<AuthenticateGoogleUseCaseResponse> {
        let user = await this.userRepository.findByGoogleId(googleId)

        if (!user) {
            user = await this.userRepository.findByEmail(email)
            if (user) {
                user.googleId = googleId
                if (!user.profileImageUrl && profileImageUrl) {
                    user.profileImageUrl = profileImageUrl
                }
                if (!user.fullname && fullname) {
                    user.fullname = fullname
                }
                await this.userRepository.save(user)
            }
        }

        if (!user) {
            const passwordHash = await hash(randomUUID(), 6)
            const username = await this.uniqueUsername(slugUsername(email, fullname))

            user = await this.userRepository.create({
                username,
                password: passwordHash,
                email,
                fullname: fullname || username,
                googleId,
                cpf: null,
                status: true,
                preferenceTicker: null,
                profileImageUrl: profileImageUrl ?? null,
                profileImageName: null,
                customColor: null,
                theme: 'dark',
                phone: null,
            })
        }

        if (user.status === false) {
            throw new DisabledUserError()
        }

        return { user }
    }

    private async uniqueUsername(base: string) {
        let candidate = base
        let suffix = 0

        while (await this.userRepository.findByUsername(candidate)) {
            suffix += 1
            candidate = `${base}${suffix}`.slice(0, 32)
        }

        return candidate
    }
}
