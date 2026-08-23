import { describe, expect, it } from 'vitest'
import { validateAvatarFile } from '@/services/storage/avatar-storage.js'
import { InvalidFileError } from '@/use-cases/_errors/invalid-file-error.js'

describe('validateAvatarFile', () => {
    it('should reject non-image mime types', () => {
        expect(() => validateAvatarFile({ mimetype: 'text/plain', size: 10 })).toThrow(InvalidFileError)
    })

    it('should reject files larger than 2MB', () => {
        expect(() => validateAvatarFile({ mimetype: 'image/png', size: 3 * 1024 * 1024 })).toThrow(InvalidFileError)
    })

    it('should accept a valid png', () => {
        expect(() => validateAvatarFile({ mimetype: 'image/png', size: 1024 })).not.toThrow()
    })
})
