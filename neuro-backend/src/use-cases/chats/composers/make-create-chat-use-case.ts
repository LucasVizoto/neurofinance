import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { PrismaChatsRepository } from "@/repositories/prisma/prisma-chat-repository.js";
import { CreateChatUseCase } from "../create-chat.js";

export function makeCreateChatUseCase() {
    const userRepository = new PrismaUserRepository()
    const chatRepository = new PrismaChatsRepository()
    const useCase = new CreateChatUseCase(userRepository, chatRepository)

    return useCase
}
