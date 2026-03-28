import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import {expect, it, describe, beforeEach} from 'vitest'
import { FindUserByIdUseCase } from './find-by-id.js'
import { ResourceNotFoundError } from '../_errors/resource-not-foud-error.js'

let userRepository: InMemoryUsersRepository
let sut: FindUserByIdUseCase
//sut = system under test

describe('Get User Profile Use-Case', () =>{

    beforeEach(()=> {
        userRepository = new InMemoryUsersRepository()
        sut = new FindUserByIdUseCase(userRepository) 
    })

    it('should be able to get user profile', async () =>{


        const createdUser = await userRepository.create({
            username: 'jhon.doe',
            zendesk_user_id: 12,
            fullname: "Jhon Doe",
            email: 'johndoe@example.com',
            password: '123456',
            phone: "1699999999",
            status: true,
        })

        const {user} = await sut.execute({
            userId: createdUser.id,
        })

        expect(user.id).toEqual(expect.any(Number))
        expect(user.username).toEqual('jhon.doe')
    })

    it('should not be able to get user profile with wrong id', async () =>{

        const createdUser = await userRepository.create({
            username: 'jhon.doe',
            zendesk_user_id: 12,
            fullname: "Jhon Doe",
            email: 'johndoe@example.com',
            password: '123456',
            phone: "1699999999",
            status: true,
        })

       await expect(() =>
            sut.execute({
                'userId': 54
            }),
        ).rejects.toBeInstanceOf(ResourceNotFoundError)

    })
})