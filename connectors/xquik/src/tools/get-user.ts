import { defineTool } from '@cloud-connectors/core';
import { z } from 'zod';
import { xquikGet } from '../client.js';

export const getUser = defineTool({
  name: 'xquik_get_user',
  description: 'Fetch an X/Twitter user profile by username or user id with Xquik.',
  inputSchema: z.object({
    user: z.string().min(1).describe('X/Twitter username or user id'),
  }),
  handler: async ({ user }, { credential, signal }) =>
    xquikGet(`/x/users/${encodeURIComponent(user)}`, {}, { apiKey: credential, signal }),
});
