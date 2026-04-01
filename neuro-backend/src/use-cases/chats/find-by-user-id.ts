import type { Chats } from "@/generated/prisma/client.js"
import type { ChatsRepository } from "@/repositories/chat-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface FindChatByUserIdUseCaseRequest {
    userId: string
}

interface FindChatByUserIdUseCaseResponse {
    chats: Chats[]
}

export class FindChatByUserIdUseCase {
    constructor(
        private chatRepository: ChatsRepository,
    ) { }

    async execute({ userId }: FindChatByUserIdUseCaseRequest): Promise<FindChatByUserIdUseCaseResponse> {
        const chats = await this.chatRepository.findByUserId(userId)

        if (!chats) {
            throw new ResourceNotFoundError()
        }

        return {
            chats,
        }
    }
}