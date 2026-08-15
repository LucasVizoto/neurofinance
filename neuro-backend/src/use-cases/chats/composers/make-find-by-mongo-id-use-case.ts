import { PrismaChatsRepository } from "@/repositories/prisma/prisma-chat-repository.js";
import { FindChatByMongoIdUseCase } from "../find-by-mongo-id.js";

export function makeFindChatByMongoIdUseCase() {
    const chatRepository = new PrismaChatsRepository()
    const useCase = new FindChatByMongoIdUseCase(chatRepository)

    return useCase
}
