import { expect, it, describe, beforeEach } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { makeChat } from '@/utils/tests/factories/make-chat.js'
import { randomInt, randomUUID } from 'node:crypto'
import { InMemoryChatsRepository } from '@/repositories/in-memory/in-memory-chats-repository.js'
import { FindChatByUserIdUseCase } from './find-by-user-id.js'

let chatRepository: InMemoryChatsRepository
let sut: FindChatByUserIdUseCase

describe('Get Chat Profile Use-Case', () => {

    beforeEach(() => {
        chatRepository = new InMemoryChatsRepository()
        sut = new FindChatByUserIdUseCase(chatRepository)
    })

    it('should be able to get chat by userId', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))
        const createdChat2 = await chatRepository.create(await makeChat({ userId: createdChat.userId }))

        const { chats } = await sut.execute({
            userId: createdChat.userId,
        })

        expect(chats).toHaveLength(2)
    })

    it('should not be able to get chat with wrong userId', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))

        const { chats } = await sut.execute({
            userId: randomUUID(),
        })

        expect(chats).toHaveLength(0)

    })
})