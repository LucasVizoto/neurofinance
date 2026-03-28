export class InvalidCredentialsError extends Error{ 
    constructor(){
        super('Invalid Credentials')
        statusCode: 403
    }
}