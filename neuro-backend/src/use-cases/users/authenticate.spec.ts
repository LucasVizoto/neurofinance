import { expect, it, describe, beforeEach } from 'vitest'
import { AuthenticateUseCase } from './authenticate.js'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { InvalidCredentialsError } from '../_errors/invalid-credentials-error.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'
import { hash } from 'bcryptjs'

let userRepository: InMemoryUsersRepository
let sut: AuthenticateUseCase

describe('Authenticate Use-Case', () => {

    beforeEach(async () => {
        userRepository = new InMemoryUsersRepository()
        sut = new AuthenticateUseCase(userRepository)

    })

    it('should be able to athenticate with email', async () => {

        const hashedPassword = await hash('123456', 6)
        await userRepository.create(await makeUser(hashedPassword, 'johndoe@example.com'))

        const { user } = await sut.execute({
            email: 'johndoe@example.com',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String))
    })

    it('should be able to athenticate with username', async () => {

        const hashedPassword = await hash('123456', 6)
        await userRepository.create(await makeUser(hashedPassword, 'johndoe@example.com', 'jhon.doe'))

        const { user } = await sut.execute({
            username: 'jhon.doe',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String))
    })

    it('should not be able to athenticate with wrong credentials', async () => {

        await userRepository.create(await makeUser('123456', 'test@example.com'))

        await expect(() =>
            sut.execute({
                email: 'johndoe@example.com',
                password: '123456'
            }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError)

    })

    it('should not be able to athenticate with wrong password', async () => {

        await userRepository.create(await makeUser('123456', 'johndoe@example.com'))

        await expect(() =>
            sut.execute({
                email: 'johndoe@example.com',
                password: '123123'
            }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError)

    })
})