import { faker } from "@faker-js/faker";

export type MakeUserParams = {
    password?: string
    email?: string
    username?: string
    cpf?: string
}

export async function makeUser(params: MakeUserParams = {}) {
    return {
        cpf: params.cpf ? params.cpf : faker.string.numeric(11),
        customColor: null,
        preferenceTicker: 'GOOG',
        profileImageName: null,
        profileImageUrl: null,
        theme: null,
        fullname: faker.person.fullName(),
        username: params.username ? params.username : faker.internet.username(),
        phone: faker.phone.number(),
        status: true,
        email: params.email ? params.email : faker.internet.email(),
        password: params.password ? params.password : faker.internet.password()
    }
}