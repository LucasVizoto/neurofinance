import request from 'supertest'
import {app} from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Find By ID (e2e)', () =>{

    beforeAll( async ()=>{
        await app.ready()
    })

    afterAll( async ()=>{
        await app.close()
    })

    it('should be able to find an User by his ID', async ()=>{

 
        const {token} = await createAndAuthenticateUser(app)
         

        const profileResponse = await request(app.server)
        .get('/me')
        .set('Authorization', `Bearer ${token}`)
        .send()


        expect(profileResponse.statusCode).toEqual(200)
        expect(profileResponse.body.user).toEqual(
            expect.objectContaining({
                email: 'johndoe@example.com'
            })
        )

    })

})