import { env } from "@/env/index.js"
import { PrismaClient } from "@/generated/prisma/index.js"


export const prisma = new PrismaClient({
    log: env.NODE_ENV === 'dev' ? ['query'] : [], 
    // log das queries apenas em ambiente de desenvolvimento
})