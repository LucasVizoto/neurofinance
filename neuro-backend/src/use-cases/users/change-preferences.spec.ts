import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-user-repository.js"
import { describe, it, expect, beforeEach } from "vitest"
import { makeUser } from "@/utils/tests/factories/make-user.js"
import { ChangePreferencesUseCase } from "./change-preferences.js"

let userRepository: InMemoryUsersRepository
let sut: ChangePreferencesUseCase

describe('Change User Preferences', () => {
    beforeEach(() => {
        userRepository = new InMemoryUsersRepository()
        sut = new ChangePreferencesUseCase(userRepository)
    })

    it('should be able to edit a user profile', async () => {

        const createdUser = await userRepository.create(await makeUser())

        await sut.execute({
            userId: createdUser.id,
            theme: 'dark',
            customColor: '#ff0000',
            preferenceTicker: 'AAPL'
        })

        expect(userRepository.items[0]).toMatchObject({
            ...createdUser,
            theme: 'dark',
            customColor: '#ff0000',
            preferenceTicker: 'AAPL'
        })
    })
})