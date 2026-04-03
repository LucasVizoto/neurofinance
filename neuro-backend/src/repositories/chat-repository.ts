import type { Chats, Prisma } from "@/generated/prisma/client.js"

export interface ChatsRepository {
    findById(chatId: number): Promise<Chats | null>
    findByUserId(userId: string): Promise<Chats[]>
    findByMongoId(mongo_id: string): Promise<Chats | null>
    create(data: Prisma.ChatsCreateInput): Promise<Chats>
    delete(chat: Chats): Promise<void>
}