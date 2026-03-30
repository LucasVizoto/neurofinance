import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Change User Preferences (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to change user preferences', async () => {

        const { token, user } = await createAndAuthenticateUser(app)

        const response = await request(app.server)
            .patch(`/users/preferences`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                theme: 'dark',
                customColor: '#000000',
                preferenceTicker: 'AAPL'
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
                    theme: 'dark',
                    customColor: '#000000',
                    preferenceTicker: 'AAPL'
                }),
            })
        )

        // Verifying changes
        expect(verifyChanges.body.user).toEqual(
            expect.objectContaining({
                theme: 'dark',
                customColor: '#000000',
                preferenceTicker: 'AAPL'
            })
        )
    })

})