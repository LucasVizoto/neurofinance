import { faker } from '@faker-js/faker'
import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomInt } from 'node:crypto'
import { makeUser } from '@/utils/tests/factories/make-user.js'
import { unknown } from 'zod'

describe('Find By Username (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to find an User by his Username', async () => {

        const username = 'johndoe'
        const email = 'johndoe@example.com'

        await request(app.server)
            .post('/users')
            .send(await makeUser(undefined, email, username))
        const authResponse = await request(app.server)
            .post('/auth')
            .send({
                email: email,
                password: '123456',
            })

        const response = await request(app.server)
            .get(`/me/byusername/${username}`)
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