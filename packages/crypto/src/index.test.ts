import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, generateMasterKey, loadMasterKey } from './index.js';

describe('crypto', () => {
  it('round-trips plaintext through encrypt/decrypt', async () => {
    const key = await loadMasterKey(generateMasterKey());
    const plaintext = 'hello, world — π 🎉';
    const ciphertext = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it('produces a different ciphertext each call (random nonce)', async () => {
    const key = await loadMasterKey(generateMasterKey());
    const a = await encrypt('same', key);
    const b = await encrypt('same', key);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('rejects ciphertext encrypted with a different key', async () => {
    const key1 = await loadMasterKey(generateMasterKey());
    const key2 = await loadMasterKey(generateMasterKey());
    const ciphertext = await encrypt('secret', key1);
    await expect(decrypt(ciphertext, key2)).rejects.toThrow();
  });

  it('rejects a tampered ciphertext (auth tag fails)', async () => {
    const key = await loadMasterKey(generateMasterKey());
    const ciphertext = await encrypt('secret', key);
    ciphertext[ciphertext.length - 1] ^= 0xff;
    await expect(decrypt(ciphertext, key)).rejects.toThrow();
  });

  it('rejects an undersized master key', async () => {
    await expect(loadMasterKey('aGVsbG8=')).rejects.toThrow(/32 bytes/);
  });
});
