import { expect, it, describe, beforeEach } from 'vitest'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'
import { CreateChatUseCase } from './create-chat.js'
import { InMemoryChatsRepository } from '@/repositories/in-memory/in-memory-chats-repository.js'
import { makeChat } from '@/utils/tests/factories/make-chat.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'

let userRepository: InMemoryUsersRepository
let chatRepository: InMemoryChatsRepository
let sut: CreateChatUseCase

describe('Create Chat Use-Case', () => {

    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        chatRepository = new InMemoryChatsRepository()
        sut = new CreateChatUseCase(userRepository, chatRepository)
    })

    it('should be able to create an new chat', async () => {

        const user = await userRepository.create(await makeUser())

        const { chat } = await sut.execute(await makeChat({ userId: user.id }))

        expect(chat.id).toEqual(expect.any(Number))
    })


    it('should not be able to create a chat for a non-existent user', async () => {

        const user = await userRepository.create(await makeUser())
        const mockedUserId = '12345678901'

        await expect(async () =>
            sut.execute(await makeChat({ userId: mockedUserId })),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)
    })
})