import type { Chats } from "@/generated/prisma/client.js"
import type { ChatsRepository } from "@/repositories/chat-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface FindChatByMongoIdUseCaseRequest {
    mongoId: string
}

interface FindChatByMongoIdUseCaseResponse {
    chat: Chats
}

export class FindChatByMongoIdUseCase {
    constructor(
        private chatRepository: ChatsRepository,
    ) { }

    async execute({ mongoId }: FindChatByMongoIdUseCaseRequest): Promise<FindChatByMongoIdUseCaseResponse> {
        const chat = await this.chatRepository.findByMongoId(mongoId)

        if (!chat) {
            throw new ResourceNotFoundError()
        }

        return {
            chat,
        }
    }
}