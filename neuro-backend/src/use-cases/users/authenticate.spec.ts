import { expect, it, describe, beforeEach } from 'vitest'
import { AuthenticateUseCase } from './authenticate.js'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { InvalidCredentialsError } from '../_errors/invalid-credentials-error.js'
import { hash } from 'bcryptjs'

let userRepository: InMemoryUsersRepository
let sut: AuthenticateUseCase

describe('Authenticate Use-Case', () => {

    beforeEach(async () => {
        userRepository = new InMemoryUsersRepository()
        sut = new AuthenticateUseCase(userRepository)

    })

    it('should be able to athenticate with email', async () => {

        await userRepository.create({
            username: 'jhon.doe',
            zendesk_user_id: 12,
            fullname: "Jhon Doe",
            email: 'johndoe@example.com',
            password: await hash('123456', 6),
            phone: "1699999999",
            status: true,
        })

        const { user } = await sut.execute({
            email: 'johndoe@example.com',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String))
        //aqui eu digo basicamente que eu espero que o user id seja igual a qualquer string
    })

    it('should be able to athenticate with username', async () => {

        await userRepository.create({
            username: 'jhon.doe',
            zendesk_user_id: 12,
            fullname: "Jhon Doe",
            email: 'johndoe@example.com',
            password: await hash('123456', 6),
            phone: "1699999999",
            status: true,
        })

        const { user } = await sut.execute({
            username: 'jhon.doe',
            password: '123456'
        })

        expect(user.id).toEqual(expect.any(String))
        //aqui eu digo basicamente que eu espero que o user id seja igual a qualquer string
    })

    it('should not be able to athenticate with wrong credentials', async () => {


        await expect(() =>
            sut.execute({
                email: 'johndoe@example.com',
                password: '123456'
            }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError)

    })

    it('should not be able to athenticate with wrong password', async () => {

        await expect(() =>
            sut.execute({
                email: 'johndoe@example.com',
                password: '123123'
            }),
        ).rejects.toBeInstanceOf(InvalidCredentialsError)

    })
})