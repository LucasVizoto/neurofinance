import { randomInt, randomUUID } from "node:crypto";
import { type Chats, type Prisma } from "@/generated/prisma/client.js";
import type { ChatsRepository } from "../chat-repository.js";

export class InMemoryChatsRepository implements ChatsRepository {

    public items: Chats[] = []

    async findById(chatId: number): Promise<Chats | null> {
        const chat = this.items.find((item) => item.id == chatId)

        if (!chat) {
            return null
        }

        return chat
    }

    async findByUserId(userId: string): Promise<Chats[]> {
        const chats = this.items.filter((item) => item.userId == userId)

        if (!chats) {
            return []
        }

        return chats
    }

    async findByMongoId(mongo_id: string): Promise<Chats | null> {
        const chat = this.items.find((item) => item.mongo_id == mongo_id)

        if (!chat) {
            return null
        }

        return chat
    }

    async create(data: Prisma.ChatsCreateInput) {
        const chat = {
            id: randomInt(1, 1000),
            userId: data.userId!,
            mongo_id: data.mongo_id! ?? randomUUID(),
            status: data.status ?? true,
            initialContext: data.initialContext!,
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(),
            deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
        }

        this.items.push(chat)

        return chat
    }

    async delete(chat: Chats): Promise<void> {
        const chatIndex = this.items.findIndex((item) => item.id === chat.id)
        if (chatIndex !== -1) {
            this.items.splice(chatIndex, 1)
        }
    }

}
