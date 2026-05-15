import { Hono } from 'hono';
import type { ConnectorDefinition } from './connector.js';
import { McpError } from './errors.js';
import { dispatchMcp } from './mcp.js';

export interface CreateMcpAppOptions {
  connector: ConnectorDefinition;
  resolveCredential: (request: Request) => Promise<{ credential: string; userId?: string }>;
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

  app.post('/mcp', async (c) => {
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
