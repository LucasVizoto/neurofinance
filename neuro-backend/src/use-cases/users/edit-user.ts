import type { Users } from "@/generated/prisma/client.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"
import type { UsersRepository } from "@/repositories/user-repository.js"


interface EditUserUseCaseRequest {
    userId: string,
    cpf?: string | null,
    theme?: string | null,
    customColor?: string | null,
    preferenceTicker?: string | null,
    profileImageUrl?: string | null,
    profileImageName?: string | null,
    username?: string | null,
    fullname?: string | null,
    email?: string | null,
    phone?: string | null,
}

interface EditUserUseCaseResponse {
    user: Users
}


export class EditUserUseCase {
    constructor(private userRepository: UsersRepository) { }

    async execute({
        userId,
        username,
        fullname,
        email,
        phone,
        cpf,
        theme,
        customColor,
        preferenceTicker,
        profileImageUrl,
        profileImageName,
    }: EditUserUseCaseRequest): Promise<EditUserUseCaseResponse> {

        const user = await this.userRepository.findById(userId)

        if (!user) {
            throw new ResourceNotFoundError()
        }

        user.username = username ?? user.username
        user.fullname = fullname ?? user.fullname
        user.email = email ?? user.email
        user.phone = phone ?? user.phone
        user.cpf = cpf ?? user.cpf
        user.theme = theme ?? user.theme
        user.customColor = customColor ?? user.customColor
        user.preferenceTicker = preferenceTicker ?? user.preferenceTicker
        user.profileImageUrl = profileImageUrl ?? user.profileImageUrl
        user.profileImageName = profileImageName ?? user.profileImageName

        await this.userRepository.save(user)

        return {
            user
        }

    }
}