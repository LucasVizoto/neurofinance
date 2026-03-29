import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { expect, it, describe, beforeEach } from 'vitest'
import { FindUserByIdUseCase } from './find-by-id.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { ChangeUserStatusUseCase } from './change-user-status.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'

let userRepository: InMemoryUsersRepository
let sut: ChangeUserStatusUseCase
//sut = system under test

describe('Change User Status', () => {

    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new ChangeUserStatusUseCase(userRepository)
    })

    it('should be able to change the user status', async () => {

        const createdUser = await userRepository.create(await makeUser())

        await sut.execute({
            userId: createdUser.id,
        })

        const findedUser = await userRepository.findById(createdUser.id)

        expect(findedUser?.status).toEqual(false)
    })

    it('should not be able to find user with wrong id', async () => {

        const createdUser = await userRepository.create(await makeUser())

        await expect(() =>
            sut.execute({
                'userId': '54'
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})