import { McpError } from '@cloud-connectors/core';

const DEFAULT_BASE_URL = 'https://xquik.com/api/v1';
const API_KEY_HEADER = 'x-api-key';

export interface XquikRequestInit {
  apiKey: string;
  signal?: AbortSignal;
}

export async function xquikGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  init: XquikRequestInit,
): Promise<T> {
  const baseUrl = process.env.XQUIK_BASE_URL ?? DEFAULT_BASE_URL;
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { [API_KEY_HEADER]: init.apiKey },
    signal: init.signal,
  });

  if (res.status === 401) {
    throw new McpError('unauthorized', 'Xquik API rejected the API key');
  }
  if (res.status === 403) {
    throw new McpError('forbidden', 'Xquik API denied the request');
  }
  if (res.status === 404) {
    throw new McpError('not_found', 'Xquik API resource not found');
  }
  if (res.status === 429) {
    throw new McpError('rate_limited', 'Xquik API rate limit exceeded');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new McpError('upstream_error', `Xquik API ${res.status}: ${body.slice(0, 500)}`);
  }

  return (await res.json()) as T;
}
