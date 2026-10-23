import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Derives a 32-byte (256-bit) buffer key from a string passphrase or secret.
 */
export function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM with authenticated tags.
 * Output format: `<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 */
export function encryptField(plaintext: string, secretKey: string | Buffer): string {
  if (typeof plaintext !== 'string') {
    throw new TypeError('Plaintext must be a string');
  }

  const keyBuffer = typeof secretKey === 'string' ? deriveKey(secretKey) : secretKey;
  if (keyBuffer.length !== 32) {
    throw new Error('Secret key must be 32 bytes (256 bits)');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted field and verifies authenticated tag integrity.
 * Throws an error if the tag does not match or the ciphertext was tampered with.
 */
export function decryptField(encryptedPayload: string, secretKey: string | Buffer): string {
  if (typeof encryptedPayload !== 'string') {
    throw new TypeError('Encrypted payload must be a string');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected <iv>:<tag>:<ciphertext>');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const keyBuffer = typeof secretKey === 'string' ? deriveKey(secretKey) : secretKey;
  if (keyBuffer.length !== 32) {
    throw new Error('Secret key must be 32 bytes (256 bits)');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: ${iv.length}`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid Auth Tag length: ${authTag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
