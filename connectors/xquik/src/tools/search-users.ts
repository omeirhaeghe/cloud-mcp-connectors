import { defineTool } from '@cloud-connectors/core';
import { z } from 'zod';
import { xquikGet } from '../client.js';

interface UserSearchResponse {
  users?: unknown[];
  nextCursor?: string;
  hasNextPage?: boolean;
  usage?: unknown;
}

export const searchUsers = defineTool({
  name: 'xquik_search_users',
  description: 'Search X/Twitter users with Xquik.',
  inputSchema: z.object({
    query: z.string().min(1).describe('X/Twitter user search query'),
    cursor: z.string().optional(),
  }),
  handler: async ({ query, cursor }, { credential, signal }) => {
    const data = await xquikGet<UserSearchResponse>(
      '/x/users/search',
      { q: query, cursor },
      { apiKey: credential, signal },
    );
    return {
      users: data.users ?? [],
      hasNextPage: data.hasNextPage ?? false,
      nextCursor: data.nextCursor,
      usage: data.usage,
    };
  },
});
