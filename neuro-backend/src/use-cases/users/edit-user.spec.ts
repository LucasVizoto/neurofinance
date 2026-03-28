import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-user-repository.js"
import { describe, it, expect, beforeEach } from "vitest"
import { EditUserUseCase } from "./edit-user.js"

let userRepository: InMemoryUsersRepository
let sut: EditUserUseCase

describe('Edit User',() =>{
  beforeEach(() =>{
    userRepository = new InMemoryUsersRepository()
    sut = new EditUserUseCase(userRepository)
  })

  it('should be able to edit a user profile', async () => {

        const createdUser = await userRepository.create({
            username: 'jhon.doe',
            zendesk_user_id: 12,
            fullname: "Jhon Doe",
            email: 'johndoe@example.com',
            password: '123456',
            phone: "1699999999",
            status: true,
        })
  
        await sut.execute({
            userId: createdUser.id,
            zendesk_user_id: 44,
            fullname: 'Jhon Doe Fullname'
        })

    expect(userRepository.items[0]).toMatchObject({
        username: 'jhon.doe',
        zendesk_user_id: 44, // expect it has changed
        fullname: "Jhon Doe Fullname", // expect it has changed
        email: 'johndoe@example.com',
        password: '123456',
        phone: "1699999999",
        status: true,
    })
  })
})