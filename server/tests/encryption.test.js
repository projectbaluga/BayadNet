const { encrypt, decrypt } = require('../utils/encryption');

describe('Encryption Utils', () => {
    const originalText = 'mySecretPassword123';

    it('should encrypt and decrypt correctly', () => {
        const encrypted = encrypt(originalText);
        expect(encrypted).not.toBe(originalText);
        expect(encrypted).toContain(':'); // IV:Content format

        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
        expect(encrypt('')).toBe('');
        expect(decrypt('')).toBe('');
    });
});
