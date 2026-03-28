import type { Users } from "@/generated/prisma/client.js"
import { ResourceNotFoundError } from "../_errors/resource-not-foud-error.js"
import type { UsersRepository } from "@/repositories/user-repository.js"


interface EditUserUseCaseRequest {
    userId: number
    username?: string | null,
    fullname?: string | null,
    email?: string | null,
    phone?: string | null,
}

interface EditUserUseCaseResponse {
    user: Users
}


export class EditUserUseCase{
  constructor(private userRepository: UsersRepository) {}

  async execute({
   userId,
   username,
   fullname,
   email,
   phone
  }: EditUserUseCaseRequest): Promise<EditUserUseCaseResponse> {

    const user = await this.userRepository.findById(userId)

    if(!user){
        throw new ResourceNotFoundError()
    }

    user.username = username ?? user.username
    user.fullname = fullname ?? user.fullname
    user.email = email ?? user.email
    user.phone = phone ?? user.phone

    await this.userRepository.save(user)

    return {
        user
    }

  }
}