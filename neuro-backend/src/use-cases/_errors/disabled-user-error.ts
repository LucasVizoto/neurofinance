export class DisabledUserError extends Error{ 
    constructor(){
        super('This User has been desabled, contact an a Admin or Account Manager to retry our access.')
        statusCode: 401
    }
}