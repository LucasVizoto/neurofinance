import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma.js'
import { hash } from 'bcryptjs'
import { createAndAuthenticateUser } from '@/utils/create-and-authenticate-user.js'
import { makeUser } from '@/utils/tests/factories/make-user.js'

describe('Change User Status (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to change the user status to desabled', async () => {

        const { token } = await createAndAuthenticateUser(app, true)

        const user = await prisma.users.create({
            data: await makeUser()
        })



        const response = await request(app.server)
            .patch(`/users/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                userId: user.id
            })

        const verifyChanges = await request(app.server)
            .get(`/me/byusername/${user.username}`)
            .set('Authorization', `Bearer ${token}`)
            .send()

        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual(
            expect.objectContaining({
                success: true
            })
        )

        // Verifying changes
        expect(verifyChanges.body.user).toEqual(
            expect.objectContaining({
                status: false
            })
        )
    })

})



