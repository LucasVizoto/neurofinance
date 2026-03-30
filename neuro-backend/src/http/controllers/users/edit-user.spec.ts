import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Edit User (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to edit the user infos', async () => {

        const { token, user } = await createAndAuthenticateUser(app)

        const response = await request(app.server)
            .put(`/users`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                fullname: 'John Doe Example',
                username: 'jhon.doe.username',
                phone: '16999999999',
            })

        const verifyChanges = await request(app.server)
            .get('/me')
            .set('Authorization', `Bearer ${token}`)
            .send()

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual(
            expect.objectContaining({
                success: true,
                message: expect.any(String),
                user: expect.objectContaining({
                    id: expect.any(String),
                }),
            })
        )

        // Verifying changes
        expect(verifyChanges.body.user).toEqual(
            expect.objectContaining({
                fullname: 'John Doe Example',
                username: 'jhon.doe.username',
                phone: '16999999999',
            })
        )
    })

})