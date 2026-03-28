import {faker} from '@faker-js/faker'
import request from 'supertest'
import {app} from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomInt } from 'node:crypto'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Find User By ID With his Demands (e2e)', () =>{

    beforeAll( async ()=>{
        await app.ready()
    })

    afterAll( async ()=>{
        await app.close()
    })

    it('should be able to find an User by his Id and, the response must contain the Demands who is associated', async ()=>{

        const {token, user} = await createAndAuthenticateUser(app, true)

        const firstCreateDemandResponse = await request(app.server)
        .post('/demands')
        .set('Authorization', `Bearer ${token}`)
        .send({
            demandName: 'New Demand'
        })
        const secondCreateDemandResponse = await request(app.server)
        .post('/demands')
        .set('Authorization', `Bearer ${token}`)
        .send({
            demandName: 'New Demand'
        })
        
        const response = await request(app.server)
        .get(`/me/with-demands`)
        .set('Authorization', `Bearer ${token}`)
        .query({
            userId: user.id
        })
        .send()


        expect(response.statusCode).toEqual(200)
        expect.objectContaining({
            user: {
                id: expect(expect.any(Number)),
                password: undefined
            },
            demands:{
                id: expect(expect.any(Number)),
            }
        })
    })

})