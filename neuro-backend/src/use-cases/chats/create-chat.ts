
import type { UsersRepository } from "@/repositories/user-repository.js"
import type { Chats } from "@/generated/prisma/client.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"
import type { ChatsRepository } from "@/repositories/chat-repository.js"
import { UserHas5ChatsError } from "../_errors/user-has-5-chats-error.js"

interface CreateChatUseCaseRequest {
    userId: string
    mongo_id: string
    initialContext: string
}

interface CreateChatUseCaseResponse {
    chat: Chats
}

export class CreateChatUseCase {
    constructor(private userRepository: UsersRepository, private chatRepository: ChatsRepository) { }

    async execute({ userId, mongo_id, initialContext }: CreateChatUseCaseRequest): Promise<CreateChatUseCaseResponse> {

        const userExists = await this.userRepository.findById(userId)

        if (!userExists) {
            throw new ResourceNotFoundError()
        }

        const userChats = await this.chatRepository.findByUserId(userId)
        if (userChats.length == 5) {
            throw new UserHas5ChatsError()
        }

        const chat = await this.chatRepository.create({
            userId,
            mongo_id,
            initialContext
        })

        return {
            chat
        }
    }
}

