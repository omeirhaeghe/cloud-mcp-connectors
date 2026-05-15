import { serve } from '@hono/node-server';
import { createMcpApp, McpError } from '@cloud-connectors/core';
import youtubeConnector from './index.js';

const apiKey = process.env.YOUTUBE_API_KEY;
const port = Number(process.env.PORT ?? 4001);

if (!apiKey) {
  console.error('YOUTUBE_API_KEY is required');
  process.exit(1);
}

const app = createMcpApp({
  connector: youtubeConnector,
  resolveCredential: async (req) => {
    const auth = req.headers.get('authorization');
    if (auth) {
      const match = /^Bearer\s+(.+)$/i.exec(auth);
      if (match?.[1] && match[1] !== apiKey) {
        throw new McpError('unauthorized', 'invalid bearer token');
      }
    }
    return { credential: apiKey };
  },
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`youtube connector listening on http://localhost:${info.port}`);
  console.log(`MCP endpoint: http://localhost:${info.port}/mcp`);
});
