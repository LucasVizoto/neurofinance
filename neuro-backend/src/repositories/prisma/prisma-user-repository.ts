import { prisma } from "@/lib/prisma.js";
import type { UsersRepository } from "../user-repository.js";
import type { Prisma, Users } from "@/generated/prisma/client.js";

export class PrismaUserRepository implements UsersRepository {
    async findById(id: string) {
        const user = await prisma.users.findUnique({
            where: {
                id: id,
            },
        })

        return user
    }

    async findByEmail(email: string) {
        const user = await prisma.users.findUnique({
            where: {
                email,
            },
        })

        return user
    }

    async findByCpf(cpf: string) {
        const user = await prisma.users.findUnique({
            where: {
                cpf,
            },
        })

        return user
    }

    async findByUsername(username: string) {
        const user = await prisma.users.findUnique({
            where: {
                username: username
            }
        })

        return user
    }

    async create(data: Prisma.UsersCreateInput) {
        const user = await prisma.users.create({
            data,
        })

        return user
    }

    async changeUserStatus(user: Users) {
        await prisma.users.update({
            where: {
                id: user.id,
            },
            data: {
                status: false
            }
        })
    }

    async save(user: Users) {
        await prisma.users.update({
            data: {
                cpf: user.cpf,
                customColor: user.customColor,
                preferenceTicker: user.preferenceTicker,
                profileImageName: user.profileImageName,
                profileImageUrl: user.profileImageUrl,
                theme: user.theme,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                updatedAt: new Date()
            },
            where: {
                id: user.id
            }
        })
    }
}