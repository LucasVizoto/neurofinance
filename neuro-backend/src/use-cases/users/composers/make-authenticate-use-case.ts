import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { AuthenticateUseCase } from "../authenticate.js";

export function makeAuthenticateUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new AuthenticateUseCase(usersRepository)

    return useCase
}