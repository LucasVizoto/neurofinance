import { PrismaUserRepository } from '@/repositories/prisma/prisma-user-repository.js'
import { AuthenticateGoogleUseCase } from '../authenticate-google.js'

export function makeAuthenticateGoogleUseCase() {
    const usersRepository = new PrismaUserRepository()
    return new AuthenticateGoogleUseCase(usersRepository)
}
