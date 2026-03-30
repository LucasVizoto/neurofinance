import { PrismaUserRepository } from "@/repositories/prisma/prisma-user-repository.js";
import { ChangePreferencesUseCase } from "../change-preferences.js";

export function makeChangePreferencesUseCase() {
    const usersRepository = new PrismaUserRepository()
    const useCase = new ChangePreferencesUseCase(usersRepository)

    return useCase
}