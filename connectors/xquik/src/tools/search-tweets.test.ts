import { afterEach, expect, it, vi } from 'vitest';
import { searchTweets } from './search-tweets.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.XQUIK_BASE_URL;
});

it('returns tweet search results with pagination metadata', async () => {
  expect.assertions(4);
  process.env.XQUIK_BASE_URL = 'https://example.test/api/v1';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL) => {
      expect(url.searchParams.get('q')).toBe('from:xquik');
      return Response.json({
        tweets: [{ id: '1', text: 'hello' }],
        hasNextPage: true,
        nextCursor: 'next',
      });
    }),
  );

  await expect(
    searchTweets.handler({ query: 'from:xquik', limit: 1 }, { credential: 'xq_test' }),
  ).resolves.toEqual({
    tweets: [{ id: '1', text: 'hello' }],
    hasNextPage: true,
    nextCursor: 'next',
    usage: undefined,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(process.env.XQUIK_BASE_URL).toBe('https://example.test/api/v1');
});
