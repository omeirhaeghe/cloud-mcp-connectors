import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchVideos } from './search.js';

const ctx = { credential: 'fake-key' };

describe('youtube_search', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('builds the right URL and maps the response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: 'abc123', kind: 'youtube#video' },
              snippet: {
                title: 'Hello',
                description: 'world',
                channelTitle: 'Chan',
                publishedAt: '2025-01-01T00:00:00Z',
                thumbnails: { medium: { url: 'https://x/thumb.jpg' } },
              },
            },
          ],
          nextPageToken: 'next',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const result = await searchVideos.handler({ query: 'hello', maxResults: 5 }, ctx);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.pathname).toBe('/youtube/v3/search');
    expect(url.searchParams.get('q')).toBe('hello');
    expect(url.searchParams.get('key')).toBe('fake-key');
    expect(url.searchParams.get('maxResults')).toBe('5');
    expect(result.results).toEqual([
      {
        videoId: 'abc123',
        title: 'Hello',
        description: 'world',
        channel: 'Chan',
        publishedAt: '2025-01-01T00:00:00Z',
        thumbnailUrl: 'https://x/thumb.jpg',
      },
    ]);
    expect(result.nextPageToken).toBe('next');
  });

  it('throws forbidden when YouTube returns 403', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('quotaExceeded', { status: 403 }));
    await expect(searchVideos.handler({ query: 'x', maxResults: 1 }, ctx)).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
