import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeUser } from '@/utils/tests/factories/make-user.js'

describe('Refresh Token (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to refresh a Token', async () => {
        await request(app.server)
            .post('/users')
            .send(await makeUser('123456', 'johndoe@example.com'))

        const authResponse = await request(app.server)
            .post('/auth')
            .send({
                email: 'johndoe@example.com',
                password: '123456',
            })

        const cookies = authResponse.get('Set-Cookie')!

        const response = await request(app.server)
            .patch('/token/refresh')
            .set('Cookie', cookies)
            .send()

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual({
            token: expect.any(String),
        })
        expect(response.get('Set-Cookie')).toEqual([
            expect.stringContaining('refreshToken='),
        ])
    })

})