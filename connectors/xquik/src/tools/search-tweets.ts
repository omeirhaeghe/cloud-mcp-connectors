import { defineTool } from '@cloud-connectors/core';
import { z } from 'zod';
import { xquikGet } from '../client.js';

interface TweetSearchResponse {
  tweets?: unknown[];
  nextCursor?: string;
  hasNextPage?: boolean;
  usage?: unknown;
}

export const searchTweets = defineTool({
  name: 'xquik_search_tweets',
  description:
    'Search X/Twitter posts with Xquik. Returns matching tweets, pagination state, and usage metadata when available.',
  inputSchema: z.object({
    query: z.string().min(1).describe('X/Twitter search query'),
    limit: z.number().int().min(1).max(100).default(10),
    cursor: z.string().optional(),
    queryType: z.enum(['Latest', 'Top']).optional(),
    sinceTime: z.string().optional(),
    untilTime: z.string().optional(),
  }),
  handler: async (
    { query, limit, cursor, queryType, sinceTime, untilTime },
    { credential, signal },
  ) => {
    const data = await xquikGet<TweetSearchResponse>(
      '/x/tweets/search',
      {
        q: query,
        limit,
        cursor,
        queryType,
        sinceTime,
        untilTime,
      },
      { apiKey: credential, signal },
    );
    return {
      tweets: data.tweets ?? [],
      hasNextPage: data.hasNextPage ?? false,
      nextCursor: data.nextCursor,
      usage: data.usage,
    };
  },
});
