import { PrismaChatsRepository } from "@/repositories/prisma/prisma-chat-repository.js";
import { FindChatByIdUseCase } from "../find-by-id.js";

export function makeFindChatByIdUseCase() {
    const chatRepository = new PrismaChatsRepository()
    const useCase = new FindChatByIdUseCase(chatRepository)

    return useCase
}
