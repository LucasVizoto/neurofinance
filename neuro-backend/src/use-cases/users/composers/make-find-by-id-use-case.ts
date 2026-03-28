import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { FindUserByIdUseCase } from "../find-by-id.js";

export function makeFindByIdUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new FindUserByIdUseCase(usersRepository)

    return useCase
}