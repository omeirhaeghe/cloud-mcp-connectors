import { defineTool } from '@cloud-connectors/core';
import { z } from 'zod';
import { xquikGet } from '../client.js';

export const getTweet = defineTool({
  name: 'xquik_get_tweet',
  description: 'Fetch a single X/Twitter tweet by id with Xquik.',
  inputSchema: z.object({
    tweetId: z.string().min(1).describe('X/Twitter tweet id'),
  }),
  handler: async ({ tweetId }, { credential, signal }) =>
    xquikGet(`/x/tweets/${encodeURIComponent(tweetId)}`, {}, { apiKey: credential, signal }),
});
