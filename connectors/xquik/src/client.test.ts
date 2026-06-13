import { afterEach, expect, it, vi } from 'vitest';
import { McpError } from '@cloud-connectors/core';
import { xquikGet } from './client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.XQUIK_BASE_URL;
});

it('sends Xquik API key and query params', async () => {
  expect.assertions(5);
  process.env.XQUIK_BASE_URL = 'https://example.test/api/v1';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL, init?: RequestInit) => {
      expect(url.toString()).toBe('https://example.test/api/v1/x/tweets/search?q=hello&limit=2');
      expect(init?.headers).toEqual({ 'x-api-key': 'xq_test' });
      return Response.json({ ok: true });
    }),
  );

  await expect(
    xquikGet('/x/tweets/search', { q: 'hello', limit: 2 }, { apiKey: 'xq_test' }),
  ).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(process.env.XQUIK_BASE_URL).toBe('https://example.test/api/v1');
});

it('maps rate limit responses to MCP errors', async () => {
  expect.assertions(2);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('too many', { status: 429 })),
  );

  await expect(xquikGet('/x/users/search', { q: 'xquik' }, { apiKey: 'xq_test' })).rejects.toThrow(
    McpError,
  );
  await expect(
    xquikGet('/x/users/search', { q: 'xquik' }, { apiKey: 'xq_test' }),
  ).rejects.toMatchObject({
    code: 'rate_limited',
  });
});
