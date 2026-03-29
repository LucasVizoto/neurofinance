import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-user-repository.js"
import { describe, it, expect, beforeEach } from "vitest"
import { EditUserUseCase } from "./edit-user.js"
import { makeUser } from "@/utils/tests/factories/make-user.js"

let userRepository: InMemoryUsersRepository
let sut: EditUserUseCase

describe('Edit User', () => {
  beforeEach(() => {
    userRepository = new InMemoryUsersRepository()
    sut = new EditUserUseCase(userRepository)
  })

  it('should be able to edit a user profile', async () => {

    const createdUser = await userRepository.create(await makeUser())

    await sut.execute({
      userId: createdUser.id,
      fullname: 'Jhon Doe Fullname',
      email: 'email@example.com'
    })

    expect(userRepository.items[0]).toMatchObject({
      ...createdUser,
      fullname: 'Jhon Doe Fullname',
      email: 'email@example.com'
    })
  })
})