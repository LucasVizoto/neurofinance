import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'

describe('Update Profile (e2e)', () => {
    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should update profile fields without an avatar', async () => {
        const { token } = await createAndAuthenticateUser(app)

        const response = await request(app.server)
            .put('/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fullname: 'Lucas Vizoto',
                phone: '16988887777',
                preferenceTicker: 'PETR4.SA',
            })

        expect(response.statusCode).toEqual(200)
        expect(response.body.user).toEqual(
            expect.objectContaining({
                fullname: 'Lucas Vizoto',
                phone: '16988887777',
                preferenceTicker: 'PETR4.SA',
            })
        )
        expect(response.body.user.password).toBeUndefined()
    })

    it('should reject invalid avatar mime type', async () => {
        const { token } = await createAndAuthenticateUser(app, false, 'avatar-invalid@example.com')

        const response = await request(app.server)
            .put('/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .attach('avatar', Buffer.from('not-an-image'), {
                filename: 'notes.txt',
                contentType: 'text/plain',
            })

        expect(response.statusCode).toEqual(400)
        expect(response.body.message).toMatch(/formato inválido/i)
    })
})
