import { prisma } from "@/lib/prisma.js";
import type { UsersRepository } from "../user-repository.js";
import type { Prisma, Chats } from "@/generated/prisma/client.js";
import type { ChatsRepository } from "../chat-repository.js";


export class PrismaChatsRepository implements ChatsRepository {

    async findById(chatId: number): Promise<Chats | null> {
        const chat = await prisma.chats.findUnique({
            where: {
                id: chatId,
            },
        })

        return chat
    }

    async findByUserId(userId: string): Promise<Chats[]> {
        const chats = await prisma.chats.findMany({
            where: {
                userId: userId,
            },
        })

        return chats
    }

    async findByMongoId(mongo_id: string): Promise<Chats | null> {
        const chat = await prisma.chats.findFirst({
            where: {
                mongo_id: mongo_id,
            },
        })

        return chat
    }

    async create(data: Prisma.ChatsCreateInput): Promise<Chats> {
        const chat = await prisma.chats.create({
            data,
        })
        return chat
    }

    async delete(chat: Chats): Promise<void> {
        await prisma.chats.delete({
            where: {
                id: chat.id,
                userId: chat.userId,
            },
        })
    }

}