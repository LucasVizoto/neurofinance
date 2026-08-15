import { PrismaChatsRepository } from "@/repositories/prisma/prisma-chat-repository.js";
import { DeleteChatUseCase } from "../delete-chat.js";

export function makeDeleteChatUseCase() {
    const chatRepository = new PrismaChatsRepository()
    const useCase = new DeleteChatUseCase(chatRepository)

    return useCase
}
