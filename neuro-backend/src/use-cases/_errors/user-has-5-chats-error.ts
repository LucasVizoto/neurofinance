export class UserHas5ChatsError extends Error {
    constructor() {
        super('User reached the limit of 5 chats')
        statusCode: 409
    }
}