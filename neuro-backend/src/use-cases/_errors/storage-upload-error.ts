export class StorageUploadError extends Error {
    constructor(message = 'Failed to upload file to storage') {
        super(message)
        this.name = 'StorageUploadError'
    }
}
