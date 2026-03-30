import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Find By Username (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to find an User by his Username', async () => {


        const { token, user } = await createAndAuthenticateUser(app)

        const response = await request(app.server)
            .get(`/me/byusername/${user.username}`)
            .set('Authorization', `Bearer ${token}`)
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