
import type { UsersRepository } from "@/repositories/user-repository.js"
import type { Chats } from "@/generated/prisma/client.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"
import type { ChatsRepository } from "@/repositories/chat-repository.js"
import { UserHas5ChatsError } from "../_errors/user-has-5-chats-error.js"

interface DeleteChatUseCaseRequest {
    userId: string
    chatId: number
}

interface DeleteChatUseCaseResponse { }

export class DeleteChatUseCase {
    constructor(private chatRepository: ChatsRepository) { }

    async execute({ chatId, userId }: DeleteChatUseCaseRequest): Promise<DeleteChatUseCaseResponse> {

        const chat = await this.chatRepository.findById(chatId)

        if (!chat) {
            throw new ResourceNotFoundError()
        }

        const userChats = await this.chatRepository.findByUserId(userId)
        if (userChats.indexOf(chat) === -1) {
            throw new ResourceNotFoundError()
        }

        await this.chatRepository.delete(chat)

        return {}
    }
}
