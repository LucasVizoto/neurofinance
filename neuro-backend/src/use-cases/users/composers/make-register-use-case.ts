import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { RegisterUseCase } from "../register.js";

export function makeRegisterUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new RegisterUseCase(usersRepository)

    return useCase
}