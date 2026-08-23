export class InvalidFileError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidFileError'
    }
}
