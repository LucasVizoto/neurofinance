import { prisma } from '@/lib/prisma.js'
import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'
import { randomInt } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import request from 'supertest'

export async function createAndAuthenticateUser(app: FastifyInstance, isAdmin = false){
    const user = await prisma.users.create({
        data:{
            zendesk_user_id: randomInt(2,50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: 'johndoe@example.com',
            password: await hash('123456', 6),
            role: isAdmin ? 'ADMIN' : 'USER' ,
        }
    })

    const authResponse = await request(app.server)
    .post('/auth')
    .send({
        email: 'johndoe@example.com',
        password:'123456',
    })

    const {token} = authResponse.body
    return {
        token,
        user
    }
}