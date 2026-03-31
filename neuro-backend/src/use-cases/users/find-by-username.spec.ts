import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { expect, it, describe, beforeEach } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { FindUserByUsernameUseCase } from './find-by-username.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'

let userRepository: InMemoryUsersRepository
let sut: FindUserByUsernameUseCase
//sut = system under test

describe('Get User Profile Use-Case', () => {

    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new FindUserByUsernameUseCase(userRepository)
    })

    it('should be able to get user profile using username filed', async () => {


        const createdUser = await userRepository.create(await makeUser({ username: 'jhon.doe' }))

        const { user } = await sut.execute({
            username: createdUser.username,
        })

        expect(user.id).toEqual(expect.any(String))
        expect(user.username).toEqual('jhon.doe')
    })

    it('should not be able to get user profile with wrong username', async () => {

        const createdUser = await userRepository.create(await makeUser({ username: 'jhon.doe' }))

        await expect(() =>
            sut.execute({
                username: 'testing'
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})