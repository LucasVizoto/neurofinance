import {faker} from '@faker-js/faker'
import request from 'supertest'
import {app} from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomInt } from 'node:crypto'

describe('Find By Username (e2e)', () =>{

    beforeAll( async ()=>{
        await app.ready()
    })

    afterAll( async ()=>{
        await app.close()
    })

    it('should be able to find an User by his Username', async ()=>{

        const createdUser = await request(app.server)
        .post('/users')
        .send({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: faker.internet.email(),
            password: '123456'
        })

        const authResponse = await request(app.server)
        .post('/auth')
        .send({
            email: createdUser.body.email,
            password:'123456',
        })


        
        const response = await request(app.server)
        .get(`/me/byusername/${createdUser.body.username}`)
        .set('Authorization', `Bearer ${authResponse.body.token}`)
        .send()


        expect(response.statusCode).toEqual(200)
        expect.objectContaining({
            user: {
                id: expect(expect.any(Number)),
                password: undefined
            }
        })
    })

})