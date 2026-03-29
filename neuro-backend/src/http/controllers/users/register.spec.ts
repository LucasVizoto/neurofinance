import { faker } from '@faker-js/faker'
import request from 'supertest'
import { app } from '@/app.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomInt } from 'node:crypto'
import { makeUser } from '@/utils/tests/factories/make-user.js'

describe('Register (e2e)', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should be able to register', async () => {
        const response = await request(app.server)
            .post('/users')
            .send(await makeUser())

        console.log(response.body)
        expect(response.statusCode).toEqual(201)
        expect.objectContaining({
            message: 'User registered successfully'
        })
    })

})