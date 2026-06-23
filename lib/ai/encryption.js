/**
 * API Key Encryption Utility
 * Secure storage of API keys for AI providers
 * © 2026 Antoine Riley
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'default-insecure-key-change-this';

/**
 * Encrypt sensitive data (API keys)
 * @param {string} plaintext - The data to encrypt
 * @returns {string} Encrypted data in format: iv:encryptedData
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;

  try {
    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(16);
    
    // Use SHA-256 hash of the key to ensure consistent 32-byte key
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data so we can decrypt later
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt API key
 * @param {string} encrypted - Encrypted data in format: iv:encryptedData
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encrypted) {
  if (!encrypted) return null;

  try {
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Use same key derivation as encryption
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Hash API key for safe comparison/verification
 * @param {string} plaintext - The API key
 * @returns {string} SHA-256 hash
 */
export function hashKey(plaintext) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Mask API key for display (show only last 4 chars)
 * @param {string} key - The API key
 * @returns {string} Masked key like "sk-ant-••••••••••4bcd"
 */
export function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  
  const firstPart = key.substring(0, key.indexOf('-') + 1);
  const lastPart = key.substring(key.length - 4);
  const masked = '•'.repeat(Math.max(4, key.length - 8));
  
  return `${firstPart}${masked}${lastPart}`;
}

/**
 * Validate API key format
 * @param {string} key - The API key
 * @param {string} provider - Provider name
 * @returns {boolean} True if key looks valid
 */
export function validateKeyFormat(key, provider) {
  if (!key || typeof key !== 'string') return false;

  const validators = {
    anthropic: (k) => k.startsWith('sk-ant-') && k.length > 20,
    claude: (k) => k.startsWith('sk-ant-') && k.length > 20,
    google: (k) => k.length > 30 && k.includes('AIzaSy'),
    gemini: (k) => k.length > 30 && k.includes('AIzaSy'),
    openai: (k) => k.startsWith('sk-') && k.length > 20,
  };

  const validator = validators[provider] || validators[provider.toLowerCase()];
  return validator ? validator(key) : key.length > 10;
}

export default {
  encrypt,
  decrypt,
  hashKey,
  maskKey,
  validateKeyFormat,
};
