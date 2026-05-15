import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
export const KEY_BYTES = 32;
export const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export function generateMasterKey(): string {
  return randomBytes(KEY_BYTES).toString('base64');
}

export async function loadMasterKey(base64Key: string): Promise<Uint8Array> {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`master key must be ${KEY_BYTES} bytes (got ${key.length})`);
  }
  return new Uint8Array(key);
}

export async function encrypt(plaintext: string, masterKey: Uint8Array): Promise<Uint8Array> {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Uint8Array.from(Buffer.concat([nonce, tag, ciphertext]));
}

export async function decrypt(ciphertext: Uint8Array, masterKey: Uint8Array): Promise<string> {
  if (ciphertext.length < NONCE_BYTES + TAG_BYTES) {
    throw new Error('ciphertext too short');
  }
  const buf = Buffer.from(ciphertext);
  const nonce = buf.subarray(0, NONCE_BYTES);
  const tag = buf.subarray(NONCE_BYTES, NONCE_BYTES + TAG_BYTES);
  const body = buf.subarray(NONCE_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, masterKey, nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(body), decipher.final()]);
  return plaintext.toString('utf8');
}
