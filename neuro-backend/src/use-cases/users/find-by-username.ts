import type { Users } from "@/generated/prisma/client.js"
import type { UsersRepository } from "@/repositories/user-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface FindUserByUsernameUseCaseRequest{
    username: string
}

interface FindUserByUsernameUseCaseResponse {
    user: Users
}

export class FindUserByUsernameUseCase{
    constructor(
        private userRepository: UsersRepository,
    ) {}

    async execute({username}: FindUserByUsernameUseCaseRequest): Promise<FindUserByUsernameUseCaseResponse>{
        const user = await this.userRepository.findByUsername(username)

        if (!user){
            throw new ResourceNotFoundError()
        }

        return{
            user,
        }
    }
}