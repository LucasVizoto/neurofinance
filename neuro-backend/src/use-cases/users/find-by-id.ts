import type { Users } from "@/generated/prisma/client.js"
import type { UsersRepository } from "@/repositories/user-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface FindUserByIdUseCaseRequest{
    userId: number
}

interface FindUserByIdUseCaseResponse {
    user: Users
}

export class FindUserByIdUseCase{
    constructor(
        private userRepository: UsersRepository,
    ) {}

    async execute({userId}: FindUserByIdUseCaseRequest): Promise<FindUserByIdUseCaseResponse>{
        const user = await this.userRepository.findById(userId)

        if (!user){
            throw new ResourceNotFoundError()
        }

        return{
            user,
        }
    }
}