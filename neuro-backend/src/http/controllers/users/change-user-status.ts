import type { FastifyRequest, FastifyReply } from 'fastify'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'
import { makeChangeUserStatusUseCase } from '@/use-cases/users/composers/make-change-user-status-use-case.js'
import z from 'zod'

export async function changeUserStatus (request: FastifyRequest, reply: FastifyReply) {
    
    const changeUserStatusBodySchema = z.object({
        userId: z.coerce.number()
    })

    const {userId} = changeUserStatusBodySchema.parse(request.body)

    try{
        
        const findByIdUseCase  = makeChangeUserStatusUseCase()
        
        await findByIdUseCase.execute({
            userId,
        })

        return reply.status(200).send({
            success: true,
            message: 'The informated user has been disabled'
        })
        
    } catch (err){
        if(err instanceof ResourceNotFoundError){
            return reply.status(404).send({message: err.message})
        }
        
        throw err
    }
}