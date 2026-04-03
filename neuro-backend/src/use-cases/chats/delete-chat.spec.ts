import { expect, it, describe, beforeEach } from 'vitest'
import { InMemoryChatsRepository } from '@/repositories/in-memory/in-memory-chats-repository.js'
import { makeChat } from '@/utils/tests/factories/make-chat.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'
import { DeleteChatUseCase } from './delete-chat.js'


let chatRepository: InMemoryChatsRepository
let sut: DeleteChatUseCase

describe('Delete Chat Use-Case', () => {

    beforeEach(() => {
        chatRepository = new InMemoryChatsRepository()
        sut = new DeleteChatUseCase(chatRepository)
    })

    it('should be able to delete an existing chat', async () => {

        const chat = await chatRepository.create(await makeChat())

        await sut.execute({ chatId: chat.id, userId: chat.userId })

        const existe = chatRepository.findById(chat.id)


        expect(existe).toMatchObject({})
    })


    it('should not be able to delete a non-existent chat', async () => {

        const chat = await chatRepository.create(await makeChat())
        await expect(async () =>
            sut.execute({ chatId: 9999999, userId: chat.userId }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)
    })

    it('should not be able to delete a chat that does not belong to the user', async () => {

        const chat = await chatRepository.create(await makeChat({ userId: 'user1' }))

        await expect(async () =>
            sut.execute({ chatId: chat.id, userId: 'user2' }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)
    })
})