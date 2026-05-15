import { describe, expect, it } from 'vitest';
import { generateOpaqueToken, hashToken } from './hash.js';

describe('hash', () => {
  it('generateOpaqueToken returns base64url of expected length', () => {
    const token = generateOpaqueToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it('hashToken is deterministic', () => {
    expect(hashToken('hello')).toBe(hashToken('hello'));
    expect(hashToken('hello')).not.toBe(hashToken('world'));
  });
});
