import { hash } from "bcryptjs"
import { UserAlreadyExistsError } from "../_errors/user-already-exists-error.js"
import type { UsersRepository } from "@/repositories/user-repository.js"
import type { Users } from "@/generated/prisma/client.js"

interface RegisterUseCaseRequest {
    cpf: string
    customColor: string | null
    preferenceTicker: string | null
    profileImageName: string | null
    profileImageUrl: string | null
    theme: string | null
    username: string
    fullname: string
    email: string
    phone: string

    password: string
    status: boolean
}

interface RegisterUseCaseResponse {
    user: Users
}

export class RegisterUseCase {
    constructor(private userRepository: UsersRepository) { }

    async execute({ cpf, customColor, preferenceTicker, profileImageName, profileImageUrl, theme, username, fullname, email, phone, password, status }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {

        const password_hash = await hash(password, 6) //numero de rounds, quantidade de vezes que vai ser um hash gerado
        //vai ser gerado um hsh do próprio hash 6 vezes

        const userWithSameEmail = await this.userRepository.findByEmail(email)
        const userWithSameUsername = await this.userRepository.findByUsername(username)
        const userWithSameCPF = await this.userRepository.findByCpf(cpf)

        if (userWithSameEmail || userWithSameUsername || userWithSameCPF) {
            throw new UserAlreadyExistsError()
        }

        const user = await this.userRepository.create({
            cpf,
            customColor,
            preferenceTicker,
            profileImageName,
            profileImageUrl,
            theme,
            username,
            fullname,
            email,
            phone,
            password: password_hash,
            status,

        })
        return {
            user,
        }
    }
}


