import type { FastifyReply, FastifyRequest } from "fastify";

export function verifyUserRole(roleToVerify: 'ADMIN' | 'ACCOUNT_MANAGER') {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        await request.jwtVerify()
        const {role} = request.user

        if(role !== roleToVerify){
            return reply.status(401).send({message: 'Unauthorized'})
        }
    }
}