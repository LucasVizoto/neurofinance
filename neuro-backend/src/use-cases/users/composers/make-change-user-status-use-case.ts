import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { ChangeUserStatusUseCase } from "../change-user-status.js";

export function makeChangeUserStatusUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new ChangeUserStatusUseCase(usersRepository)

    return useCase
}