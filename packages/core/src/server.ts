import { Hono, type Context } from 'hono';
import type { ConnectorDefinition } from './connector.js';
import { McpError } from './errors.js';
import { dispatchMcp } from './mcp.js';

export interface CreateMcpAppOptions {
  connector: ConnectorDefinition;
  resolveCredential: (request: Request) => Promise<{ credential: string; userId?: string }>;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

function applyCors(c: Context): void {
  for (const [k, v] of Object.entries(CORS_HEADERS)) c.header(k, v);
}

export function createMcpApp({ connector, resolveCredential }: CreateMcpAppOptions): Hono {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, connector: connector.id }));

  app.get('/', (c) =>
    c.json({
      connector: connector.id,
      name: connector.name,
      description: connector.description,
      mcp: { transport: 'streamable-http', endpoint: '/mcp' },
    }),
  );

  app.options('/mcp', (c) => {
    applyCors(c);
    return c.body(null, 204);
  });

  app.post('/mcp', async (c) => {
    applyCors(c);
    const body = await c.req.json().catch(() => null);
    if (body == null) throw new McpError('invalid_input', 'request body must be JSON');
    const { credential, userId } = await resolveCredential(c.req.raw);
    const out = await dispatchMcp(connector, {
      body,
      ctx: { credential, userId, signal: c.req.raw.signal },
    });
    if (out == null) return c.body(null, 204);
    return c.json(out);
  });

  const mcpMethodNotAllowed = (c: Context) => {
    applyCors(c);
    c.header('Allow', 'POST, OPTIONS');
    return c.json(
      { error: { code: 'method_not_allowed', message: 'only POST is supported on /mcp' } },
      405,
    );
  };
  app.get('/mcp', mcpMethodNotAllowed);
  app.delete('/mcp', mcpMethodNotAllowed);

  app.notFound((c) => c.json({ error: { code: 'not_found', message: 'route not found' } }, 404));

  app.onError((err, c) => {
    if (err instanceof McpError) {
      return c.json(
        { error: { code: err.code, message: err.message } },
        err.status as 400 | 401 | 403 | 404 | 429 | 500 | 502,
      );
    }
    console.error('[mcp] unexpected error', err);
    return c.json({ error: { code: 'internal', message: 'internal server error' } }, 500);
  });

  return app;
}
