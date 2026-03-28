import type { Prisma, Users } from "@/generated/prisma/client.js"

export interface UsersRepository{
    findById(userId: string): Promise<Users | null>
    findByEmail(email: string): Promise<Users | null>
    findByUsername(username: string): Promise<Users | null>
    create (data: Prisma.UsersCreateInput): Promise<Users>
    changeUserStatus(user: Users): Promise<void>
    save(user: Users): Promise<void>
}