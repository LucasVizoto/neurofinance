import type { Chats } from "@/generated/prisma/client.js"
import type { ChatsRepository } from "@/repositories/chat-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface FindChatByIdUseCaseRequest {
    chatId: number
}

interface FindChatByIdUseCaseResponse {
    chat: Chats
}

export class FindChatByIdUseCase {
    constructor(
        private chatRepository: ChatsRepository,
    ) { }

    async execute({ chatId }: FindChatByIdUseCaseRequest): Promise<FindChatByIdUseCaseResponse> {
        const chat = await this.chatRepository.findById(chatId)

        if (!chat) {
            throw new ResourceNotFoundError()
        }

        return {
            chat,
        }
    }
}