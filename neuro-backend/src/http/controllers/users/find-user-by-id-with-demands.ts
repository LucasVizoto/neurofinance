import type { FastifyRequest, FastifyReply } from 'fastify'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeFindByIdUseCase } from '@/use-cases/users/composers/make-find-by-id-use-case.js'
import z from 'zod'
import { makeFindUsersOnDemandsByUserIdUseCase } from '@/use-cases/users-on-demands/factories/make-find-users-on-demands-by-user-id.js'
import { makeFindDemandByIdUseCase } from '@/use-cases/demands/factories/make-find-demand-by-id.js'
import type { Demands } from '@/generated/prisma/client.js'

export async function findUserByIdWithDemands (request: FastifyRequest, reply: FastifyReply) {
    const findByUsernameBodySchema = z.object({
        userId: z.coerce.number(),
    })

    const {userId} = findByUsernameBodySchema.parse(request.query)
    let demands:Demands[] = []
    
    try{

        const findByIdUseCase  = makeFindByIdUseCase()
        const findUsersOnDemandsByUserIdUseCase  = makeFindUsersOnDemandsByUserIdUseCase()
        const findDemandByIdUseCase  = makeFindDemandByIdUseCase()
        
        const {user} = await findByIdUseCase.execute({
            userId,
        })
        
        const {usersOnDemandsRelation} = await findUsersOnDemandsByUserIdUseCase.execute({
            userId,
        })


        const demands = await Promise.all(
        usersOnDemandsRelation.map(async (item) => {
            const { demand } = await findDemandByIdUseCase.execute({
                demandId: item.demandId,
            })

            return demand
        })
        )

        return reply.status(200).send({
            user:{
                ...user,
                password: undefined,
            },
            demands
        })
        
    } catch (err){
        if(err instanceof ResourceNotFoundError){
            return reply.status(404).send({message: err.message})
        }
        
        throw err
    }
}