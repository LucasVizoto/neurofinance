import { expect, it, describe, beforeEach } from 'vitest'
import { hash } from 'bcryptjs'
import { AuthenticateGoogleUseCase } from './authenticate-google.js'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { DisabledUserError } from '../_errors/disabled-user-error.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'

let userRepository: InMemoryUsersRepository
let sut: AuthenticateGoogleUseCase

describe('Authenticate Google Use-Case', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new AuthenticateGoogleUseCase(userRepository)
    })

    it('should create a new user when Google account is unknown', async () => {
        const { user } = await sut.execute({
            googleId: 'google-123',
            email: 'lucas@gmail.com',
            fullname: 'Lucas Silva',
            profileImageUrl: 'https://lh3.googleusercontent.com/a/photo',
        })

        expect(user.id).toEqual(expect.any(String))
        expect(user.googleId).toBe('google-123')
        expect(user.email).toBe('lucas@gmail.com')
        expect(user.cpf).toBeNull()
        expect(user.username).toBe('lucas')
    })

    it('should link Google id to an existing email account', async () => {
        const hashedPassword = await hash('123456', 6)
        await userRepository.create(
            await makeUser({
                password: hashedPassword,
                email: 'lucas@gmail.com',
                username: 'lucas.vizoto',
            }),
        )

        const { user } = await sut.execute({
            googleId: 'google-123',
            email: 'lucas@gmail.com',
            fullname: 'Lucas Silva',
        })

        expect(user.username).toBe('lucas.vizoto')
        expect(user.googleId).toBe('google-123')
        expect(userRepository.items).toHaveLength(1)
    })

    it('should authenticate an already linked Google account', async () => {
        await sut.execute({
            googleId: 'google-123',
            email: 'lucas@gmail.com',
            fullname: 'Lucas Silva',
        })

        const { user } = await sut.execute({
            googleId: 'google-123',
            email: 'lucas@gmail.com',
            fullname: 'Lucas Silva',
        })

        expect(user.googleId).toBe('google-123')
        expect(userRepository.items).toHaveLength(1)
    })

    it('should not authenticate a disabled user', async () => {
        const { user } = await sut.execute({
            googleId: 'google-123',
            email: 'lucas@gmail.com',
            fullname: 'Lucas Silva',
        })
        user.status = false
        await userRepository.save(user)

        await expect(() =>
            sut.execute({
                googleId: 'google-123',
                email: 'lucas@gmail.com',
                fullname: 'Lucas Silva',
            }),
        ).rejects.toBeInstanceOf(DisabledUserError)
    })
})
