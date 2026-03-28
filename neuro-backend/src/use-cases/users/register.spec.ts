import {expect, it, describe, beforeEach} from 'vitest'
import { RegisterUseCase } from './register.js'
import { compare } from 'bcryptjs'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-user-repository.js'
import { UserAlreadyExistsError } from '../_errors/user-already-exists-error.js'
import { faker } from '@faker-js/faker'
import { randomInt } from 'node:crypto'

let userRepository: InMemoryUsersRepository
let sut: RegisterUseCase

describe('Register Use-Case', () =>{
    
    beforeEach(()=>{
        userRepository = new InMemoryUsersRepository()
        sut = new RegisterUseCase(userRepository)
    })

    it('should be able to register', async () =>{

        const {user} = await sut.execute({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: faker.internet.email(),
            password: faker.internet.password()
        })

        expect(user.id).toEqual(expect.any(Number))
    })



    it('should hash user password upon registration', async () =>{

        const {user} = await sut.execute({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: faker.internet.email(),
            password: '123456'
        })
        
        const isPassowrdCorrectlyHashed = await compare(
            '123456',
            user.password
        )
        //aqui eu faço a comparação se o valor que eu se assemelha ao hash


        expect(isPassowrdCorrectlyHashed).toBe(true)
    })


    it('should not be able to register with same email twice', async () =>{

        const email = 'johndoe@example.com'

        await sut.execute({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: faker.internet.username(),
            phone: faker.phone.number(),
            status:true,
            email: email,
            password: faker.internet.password()
        })

        await expect(() =>
            sut.execute({
                zendesk_user_id: randomInt(50),
                fullname: faker.person.fullName(),
                username: faker.internet.username(),
                phone: faker.phone.number(),
                status:true,
                email: email,
                password: faker.internet.password()
            }),
        ).rejects.toBeInstanceOf(UserAlreadyExistsError)
    })

     it('should not be able to register with same username twice', async () =>{

        const username = 'johndoe'

        await sut.execute({
            zendesk_user_id: randomInt(50),
            fullname: faker.person.fullName(),
            username: username,
            phone: faker.phone.number(),
            status:true,
            email: faker.internet.email(),
            password: faker.internet.password()
        })

        await expect(() =>
            sut.execute({
                zendesk_user_id: randomInt(50),
                fullname: faker.person.fullName(),
                username: username,
                phone: faker.phone.number(),
                status:true,
                email: faker.internet.email(),
                password: faker.internet.password()
            }),
        ).rejects.toBeInstanceOf(UserAlreadyExistsError)
    })

})