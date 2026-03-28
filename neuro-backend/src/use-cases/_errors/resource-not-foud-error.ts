export class ResourceNotFoundError extends Error{ 
    constructor(){
        super('Resource Not Foud')
        statusCode: 404
    }
}