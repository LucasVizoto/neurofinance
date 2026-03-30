import { hash } from "bcryptjs"
import { UserAlreadyExistsError } from "../_errors/user-already-exists-error.js"
import type { UsersRepository } from "@/repositories/user-repository.js"
import type { Users } from "@/generated/prisma/client.js"

interface RegisterUseCaseRequest {
    username: string
    password: string
    email: string
    fullname: string
    cpf: string
    status: boolean
    theme?: string | null
    customColor?: string | null
    profileImageName?: string | null
    profileImageUrl?: string | null
    preferenceTicker?: string | null
    phone?: string
}

interface RegisterUseCaseResponse {
    user: Users
}

export class RegisterUseCase {
    constructor(private userRepository: UsersRepository) { }

    async execute({ cpf, customColor, preferenceTicker, profileImageName, profileImageUrl, theme, username, fullname, email, phone, password, status }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {

        const password_hash = await hash(password, 6)

        const userWithSameEmail = await this.userRepository.findByEmail(email)
        const userWithSameUsername = await this.userRepository.findByUsername(username)
        const userWithSameCPF = await this.userRepository.findByCpf(cpf)

        if (userWithSameEmail || userWithSameUsername || userWithSameCPF) {
            throw new UserAlreadyExistsError()
        }

        const user = await this.userRepository.create({
            username,
            password: password_hash,
            email,
            fullname,
            cpf,
            status,
            customColor: customColor ?? null,
            preferenceTicker: preferenceTicker ?? null,
            profileImageName: profileImageName ?? null,
            profileImageUrl: profileImageUrl ?? null,
            theme: theme ?? null,
            phone: phone ?? null,
        })
        return {
            user,
        }
    }
}


