import type { UsersRepository } from "@/repositories/user-repository.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"

interface ChangeUserStatusUseCaseRequest {
    userId: string
}

interface ChangeUserStatusUseCaseResponse { }

export class ChangeUserStatusUseCase {
    constructor(
        private userRepository: UsersRepository,
    ) { }

    async execute({ userId }: ChangeUserStatusUseCaseRequest): Promise<ChangeUserStatusUseCaseResponse> {
        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new ResourceNotFoundError()
        }

        await this.userRepository.changeUserStatus(user)

        return {}
    }
}