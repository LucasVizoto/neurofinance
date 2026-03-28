import { randomInt, randomUUID } from "node:crypto";
import type { UsersRepository } from "../user-repository.js";
import { type Prisma, type Users } from "@/generated/prisma/client.js";
import { hash } from "bcryptjs";

export class InMemoryUsersRepository implements UsersRepository {

    public items: Users[] = []

    async findById(userId: string): Promise<Users | null> {
        const user = this.items.find((item) => item.id == userId)

        if (!user) {
            return null
        }

        return user
    }

    async findByEmail(email: string) {
        const user = this.items.find(item => item.email == email)

        if (!user) {
            return null
        }

        return user
    }

    async findByUsername(username: string) {
        const user = this.items.find(item => item.username == username)

        if (!user) {
            return null
        }

        return user
    }

    async create(data: Prisma.UsersCreateInput) {
        const user = {
            id: data.id ?? randomUUID(),
            fullname: data.fullname!,
            username: data.username!,
            cpf: data.cpf!,
            customColor: data.customColor ?? null,
            preferenceTicker: data.preferenceTicker ?? null,
            profileImageName: data.profileImageName ?? null,
            profileImageUrl: data.profileImageUrl ?? null,
            theme: data.theme ?? null,
            email: data.email!,
            phone: data.phone ?? null,
            password: await hash(data.password!, 6),
            status: data.status ?? true,
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(),
            deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
        }

        this.items.push(user)

        return user
    }

    async changeUserStatus(user: Users) {
        const foundUser = this.items.find(item => item.id === user.id)

        if (!foundUser) {
            return
        }

        foundUser.status = false
    }

    async save(user: Users) {
        const itemIndex = this.items.findIndex((item) =>
            item.id === user.id
        )
        this.items[itemIndex] = user
    }

}
