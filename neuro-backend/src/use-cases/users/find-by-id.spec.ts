import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { expect, it, describe, beforeEach } from 'vitest'
import { FindUserByIdUseCase } from './find-by-id.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'
import { randomUUID } from 'node:crypto'

let userRepository: InMemoryUsersRepository
let sut: FindUserByIdUseCase
//sut = system under test

describe('Get User Profile Use-Case', () => {

    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new FindUserByIdUseCase(userRepository)
    })

    it('should be able to get user profile', async () => {


        const createdUser = await userRepository.create(await makeUser({ username: 'jhon.doe' }))

        const { user } = await sut.execute({
            userId: createdUser.id,
        })

        expect(user.id).toEqual(expect.any(String))
        expect(user.username).toEqual('jhon.doe')
    })

    it('should not be able to get user profile with wrong id', async () => {

        const createdUser = await userRepository.create(await makeUser())

        await expect(() =>
            sut.execute({
                'userId': randomUUID()
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})