import type { Users } from "@/generated/prisma/client.js";
import type { UsersRepository } from "@/repositories/user-repository.js";
import { compare } from "bcryptjs";
import { InvalidCredentialsError } from "../_errors/invalid-credentials-error.js";
import { DisabledUserError } from "../_errors/disabled-user-error.js";

interface AuthenticateUseCaseRequest{
    email?: string
    username?: string
    password: string
}

interface AuthenticateUseCaseResponse {
    user: Users
}

export class AuthenticateUseCase{
    constructor(
        private userRepository: UsersRepository,
    ) {}

    async execute({email, username, password}: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse>{
       let user

       if(email){
           user = await this.userRepository.findByEmail(email)
       }

       if(username){
           user = await this.userRepository.findByUsername(username)
       }

        if (!user){
            throw new InvalidCredentialsError()
        }

        if(user.status === false){
            throw new DisabledUserError()
        }

        const doesPasswordMatches = await compare(password, user.password)

        if(!doesPasswordMatches){
            throw new InvalidCredentialsError()
        }

        return{
            user,
        }
    }
}