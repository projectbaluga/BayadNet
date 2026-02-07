const crypto = require('crypto');

// Use environment variable or fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypt text
 * @param {string} text
 * @returns {string} iv:encryptedText
 */
function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    return text; // Return original if fails (fallback, risky but keeps app running)
  }
}

/**
 * Decrypt text
 * @param {string} text
 * @returns {string} decryptedText
 */
function decrypt(text) {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted format (Lazy Migration)

    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // console.error('Decryption error (might be plaintext):', err.message);
    return text; // Return original if fails or is plaintext
  }
}

module.exports = { encrypt, decrypt };
