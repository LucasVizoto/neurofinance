import {faker} from '@faker-js/faker'
import request from 'supertest'
import {app} from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomInt } from 'node:crypto'

describe('Register (e2e)', () =>{

    beforeAll( async ()=>{
        await app.ready()
    })

    afterAll( async ()=>{
        await app.close()
    })

    it('should be able to register', async ()=>{
        const response = await request(app.server)
        .post('/users')
        .send({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: faker.internet.email(),
            password: faker.internet.password()
        })

        expect(response.statusCode).toEqual(201)
        expect.objectContaining({
            user: {
                id: expect(expect.any(Number))
            }
        })
    })

})