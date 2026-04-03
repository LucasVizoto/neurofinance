import { expect, it, describe, beforeEach } from 'vitest'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { makeChat } from '@/utils/tests/factories/make-chat.js'
import { randomUUID } from 'node:crypto'
import { InMemoryChatsRepository } from '@/repositories/in-memory/in-memory-chats-repository.js'
import { FindChatByMongoIdUseCase } from './find-by-mongo-id.js'

let chatRepository: InMemoryChatsRepository
let sut: FindChatByMongoIdUseCase

describe('Get Chat Profile Use-Case', () => {

    beforeEach(() => {
        chatRepository = new InMemoryChatsRepository()
        sut = new FindChatByMongoIdUseCase(chatRepository)
    })

    it('should be able to get chat by mongo id', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))

        const { chat } = await sut.execute({
            mongoId: createdChat.mongo_id,
        })

        expect(chat.mongo_id).toEqual(expect.any(String))
        expect(chat.id).toEqual(expect.any(Number))
        expect(chat.userId).toEqual(createdChat.userId)
    })

    it('should not be able to get chat with wrong id', async () => {

        const createdChat = await chatRepository.create(await makeChat({ userId: randomUUID() }))

        await expect(() =>
            sut.execute({
                mongoId: randomUUID()
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})