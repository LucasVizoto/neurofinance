import type { Users } from "@/generated/prisma/client.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"
import type { UsersRepository } from "@/repositories/user-repository.js"


interface ChangePreferencesUseCaseRequest {
    userId: string,
    theme?: string | null,
    customColor?: string | null,
    preferenceTicker?: string | null,
}

interface ChangePreferencesUseCaseResponse {
    user: Users
}


export class ChangePreferencesUseCase {
    constructor(private userRepository: UsersRepository) { }

    async execute({
        userId,
        theme,
        customColor,
        preferenceTicker,
    }: ChangePreferencesUseCaseRequest): Promise<ChangePreferencesUseCaseResponse> {

        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new ResourceNotFoundError()
        }

        user.theme = theme ?? user.theme
        user.customColor = customColor ?? user.customColor
        user.preferenceTicker = preferenceTicker ?? user.preferenceTicker

        await this.userRepository.save(user)

        return {
            user
        }

    }
}