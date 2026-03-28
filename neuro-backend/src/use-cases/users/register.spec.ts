import { expect, it, describe, beforeEach } from 'vitest'
import { RegisterUseCase } from './register.js'
import { compare } from 'bcryptjs'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { UserAlreadyExistsError } from '../_errors/user-already-exists-error.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'

let userRepository: InMemoryUsersRepository
let sut: RegisterUseCase

describe('Register Use-Case', () => {

    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new RegisterUseCase(userRepository)
    })

    it('should be able to register', async () => {

        const { user } = await sut.execute(await makeUser())

        expect(user.id).toEqual(expect.any(String))
    })



    it('should hash user password upon registration', async () => {

        const { user } = await sut.execute(await makeUser('123456'))

        const isPassowrdCorrectlyHashed = await compare(
            '123456',
            user.password
        )
        //aqui eu faço a comparação se o valor que eu se assemelha ao hash


        expect(isPassowrdCorrectlyHashed).toBe(true)
    })


    it('should not be able to register with same email twice', async () => {

        const email = 'johndoe@example.com'

        await sut.execute(await makeUser(undefined, email))

        await expect(async () =>
            sut.execute(await makeUser(undefined, email)),
        ).rejects.toBeInstanceOf(UserAlreadyExistsError)
    })

    it('should not be able to register with same username twice', async () => {

        const username = 'johndoe'

        await sut.execute(await makeUser(undefined, undefined, username))

        await expect(async () =>
            sut.execute(await makeUser(undefined, undefined, username)),
        ).rejects.toBeInstanceOf(UserAlreadyExistsError)
    })

    it('should not be able to register with same cpf twice', async () => {

        const cpf = '12345678901'

        await sut.execute(await makeUser(undefined, undefined, undefined, cpf))

        await expect(async () =>
            sut.execute(await makeUser(undefined, undefined, undefined, cpf)),
        ).rejects.toBeInstanceOf(UserAlreadyExistsError)
    })
})