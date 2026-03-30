import { prisma } from '@/lib/prisma.js'
import type { FastifyInstance } from 'fastify'
import request from 'supertest'
import { makeUser } from './tests/factories/make-user.js'

export async function createAndAuthenticateUser(app: FastifyInstance, isAdmin = false) {
    const user = await prisma.users.create({
        data: await makeUser('123456', 'um@email.ai')
    })

    const authResponse = await request(app.server)
        .post('/auth')
        .send({
            email: 'johndoe@example.com',
            password: '123456',
        })

    const { token } = authResponse.body
    return {
        token,
        user: {
            ...user,
            password: undefined
        },

    }
}