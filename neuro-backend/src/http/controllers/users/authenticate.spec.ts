import request from 'supertest'
import {app} from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { faker } from '@faker-js/faker'
import { randomInt } from 'crypto'

describe('Authenticate (e2e)', () =>{

    beforeAll( async ()=>{
        await app.ready()
    })

    afterAll( async ()=>{
        await app.close()
    })

    it('should be able to authenticate', async ()=>{
        await request(app.server)
        .post('/users')
        .send({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: 'johndoe@example.com',
            password: '123456'
        })

        const response = await request(app.server)
        .post('/auth')
        .send({
            email: 'johndoe@example.com',
            password:'123456',
        })

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            token: expect.any(String),
        })
    })

})