import { randomInt } from "node:crypto";
import type { UsersRepository } from "../user-repository.js";
import { Role, type Prisma, type Users } from "@/generated/prisma/client.js";

export class InMemoryUsersRepository implements UsersRepository{
    
    public items: Users[] = []
    
    async findById(userId: number): Promise<Users | null> {
        const user = this.items.find((item) => item.id == userId)
        
        if (!user){
            return null
        }
        
        return user
    }

    async findByEmail(email: string){
        const user = this.items.find(item => item.email == email)

        if (!user){
            return null
        }
        
        return user
    }
    
    async findByUsername(username: string){
        const user = this.items.find(item => item.username == username)

        if (!user){
            return null
        }
        
        return user
    }
    
    async create(data: Prisma.UsersCreateInput) {
        const user = {
            id: data.id ?? randomInt(50),
            fullname: data.fullname!,
            username: data.username!,
            email: data.email!,
            phone: data.phone ?? null,
            role: data.role ?? Role.USER,
            password: data.password!,
            status: data.status ?? true,
            created_at: data.created_at instanceof Date ? data.created_at : new Date(),
            updated_at: data.updated_at instanceof Date ? data.updated_at : new Date(),
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
