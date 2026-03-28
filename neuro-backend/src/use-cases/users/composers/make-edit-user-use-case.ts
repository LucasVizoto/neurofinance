import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { EditUserUseCase } from "../edit-user.js";

export function makeEditUserUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new EditUserUseCase(usersRepository)

    return useCase
}