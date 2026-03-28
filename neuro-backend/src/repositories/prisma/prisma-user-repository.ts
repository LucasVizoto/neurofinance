import { prisma } from "@/lib/prisma.js";
import type { UsersRepository } from "../user-repository.js";
import type { Prisma, Users } from "@/generated/prisma/client.js";

/**
 * A classe `PrismaUserRepository` representa a implementação real do repositório de usuários,
 * utilizando o ORM Prisma para realizar operações diretamente no banco de dados.
 *
 * Esta classe segue o contrato definido pela interface `UsersRepository`, garantindo que o restante
 * da aplicação possa depender apenas da abstração, e não de detalhes específicos do Prisma.
 *
 * **Diferentemente da implementação InMemory usada em testes, este repositório realiza consultas,
 * buscas e criação de registros de forma persistente, refletindo os dados reais da aplicação.**
 *
 */
export class PrismaUserRepository implements UsersRepository{
    async findById(id: number) {
        const user = await prisma.users.findUnique({
            where:{
                id: id,
            },
        })

        return user
    }

    async findByEmail(email: string) {
        const user = await prisma.users.findUnique({
            where:{
                email,
            },
        })

        return user
    }

    async findByUsername(username: string){
        const user = await prisma.users.findUnique({
            where: {
                username: username
            }
        })

        return user
    }

    async create(data: Prisma.UsersCreateInput){
        const user = await prisma.users.create({
            data,
        })
    
        return user
    }

    async changeUserStatus(user: Users){
        await prisma.users.update({
            where: {
                id: user.id,
            },
            data:{
                status: false
            }
        })
    }

    async save(user: Users){
        await prisma.users.update({
            data:{
                zendesk_user_id: user.zendesk_user_id,
                username: user.username,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                updated_at: new Date()
            },
            where: {
                id: user.id
            }
        })
    }
}