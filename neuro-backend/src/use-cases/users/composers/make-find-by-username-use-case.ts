import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { RegisterUseCase } from "../register.js";
import { FindUserByUsernameUseCase } from "../find-by-username.js";

export function makeFindByUsernameUseCase(){
    const usersRepository = new PrismaUserRepository()
    const useCase = new FindUserByUsernameUseCase(usersRepository)

    return useCase
}