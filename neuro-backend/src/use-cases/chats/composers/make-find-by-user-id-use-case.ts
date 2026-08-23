import { PrismaChatsRepository } from "@/repositories/prisma/prisma-chat-repository.js";
import { FindChatByUserIdUseCase } from "../find-by-user-id.js";

export function makeFindChatByUserIdUseCase() {
    const chatRepository = new PrismaChatsRepository()
    const useCase = new FindChatByUserIdUseCase(chatRepository)

    return useCase
}
