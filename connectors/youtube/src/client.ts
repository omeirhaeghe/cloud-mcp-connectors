import { McpError } from '@cloud-connectors/core';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeRequestInit {
  apiKey: string;
  signal?: AbortSignal;
}

export async function youtubeGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  init: YouTubeRequestInit,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('key', init.apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal: init.signal });
  if (res.status === 401 || res.status === 403) {
    throw new McpError('forbidden', `YouTube API rejected the API key (${res.status})`);
  }
  if (res.status === 429) {
    throw new McpError('rate_limited', 'YouTube API rate limit exceeded');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new McpError('upstream_error', `YouTube API ${res.status}: ${body.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}
