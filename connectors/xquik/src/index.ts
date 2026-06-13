import { defineConnector } from '@cloud-connectors/core';
import { getTweet } from './tools/get-tweet.js';
import { getUser } from './tools/get-user.js';
import { searchTweets } from './tools/search-tweets.js';
import { searchUsers } from './tools/search-users.js';

const xquikConnector = defineConnector({
  id: 'xquik',
  name: 'Xquik',
  description:
    'Read-only X/Twitter connector: search tweets, fetch tweets, search users, and fetch user profiles through Xquik.',
  auth: {
    type: 'apiKey',
    envVar: 'XQUIK_API_KEY',
    label: 'Xquik API key',
    placeholder: 'xq_...',
  },
  homepage: 'https://docs.xquik.com/api-reference/overview',
  tools: [searchTweets, getTweet, searchUsers, getUser],
});

export default xquikConnector;
export { xquikConnector };
export { searchTweets, getTweet, searchUsers, getUser };
