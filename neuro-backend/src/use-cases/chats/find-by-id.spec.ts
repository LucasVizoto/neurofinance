import { expect, it, describe, beforeEach } from 'vitest'
import { FindChatByIdUseCase } from './find-by-id.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { makeChat } from '@/utils/tests/factories/make-chat.js'
import { randomInt, randomUUID } from 'node:crypto'
import { InMemoryChatsRepository } from '@/repositories/in-memory/in-memory-chats-repository.js'

let chatRepository: InMemoryChatsRepository
let sut: FindChatByIdUseCase

describe('Get Chat Profile Use-Case', () => {

    beforeEach(() => {
        chatRepository = new InMemoryChatsRepository()
        sut = new FindChatByIdUseCase(chatRepository)
    })

    it('should be able to get chat by id', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))

        const { chat } = await sut.execute({
            chatId: createdChat.id,
        })

        expect(chat.id).toEqual(expect.any(Number))
        expect(chat.userId).toEqual(createdChat.userId)
    })

    it('should not be able to get chat with wrong id', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))

        await expect(() =>
            sut.execute({
                'chatId': randomInt(8000, 9000)
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})