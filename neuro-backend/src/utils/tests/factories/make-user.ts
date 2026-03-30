import { faker } from "@faker-js/faker";

export async function makeUser(password?: string, email?: string, username?: string, cpf?: string) {
    return {
        cpf: cpf ? cpf : faker.string.numeric(11),
        customColor: null,
        preferenceTicker: 'GOOG',
        profileImageName: null,
        profileImageUrl: null,
        theme: null,
        fullname: faker.person.fullName(),
        username: username ? username : faker.internet.username(),
        phone: faker.phone.number(),
        status: true,
        email: email ? email : faker.internet.email(),
        password: password ? password : faker.internet.password()
    }
}