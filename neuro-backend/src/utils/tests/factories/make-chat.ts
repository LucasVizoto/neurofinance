import { faker } from "@faker-js/faker";

export type MakeChatParams = {
    initialContext?: string
    mongo_id?: string
    userId?: string
}

export async function makeChat(params: MakeChatParams = {}) {
    return {
        initialContext: params.initialContext ? params.initialContext : faker.lorem.paragraph(),
        mongo_id: params.mongo_id ? params.mongo_id : faker.string.uuid(),
        userId: params.userId ? params.userId : faker.string.uuid()
    }
}