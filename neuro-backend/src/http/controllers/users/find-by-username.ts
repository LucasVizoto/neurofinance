import type { FastifyRequest, FastifyReply } from 'fastify'
import {z} from 'zod'
import { makeFindByUsernameUseCase } from '@/use-cases/users/composers/make-find-by-username-use-case.js'
import { ResourceNotFoundError } from '@/use-cases/_errors/resource-not-foud-error.js'

export async function findUserByUsername (request: FastifyRequest, reply: FastifyReply) {
    const findByUsernameBodySchema = z.object({
        username: z.string(),
    })

    const {username} = findByUsernameBodySchema.parse(request.params)
    
    try{
        
        const findByUsernameUseCase  = makeFindByUsernameUseCase()
        
        const {user} = await findByUsernameUseCase.execute({
            username,
        })

        return reply.status(200).send({
            user:{
                ...user,
                password: undefined
            }
        })
        
    } catch (err){
        if(err instanceof ResourceNotFoundError){
            return reply.status(404).send({message: err.message})
        }
        
        throw err
    }
}