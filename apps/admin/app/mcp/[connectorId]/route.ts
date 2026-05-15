import type { NextRequest } from 'next/server';
import { decrypt, loadMasterKey } from '@cloud-connectors/crypto';
import { dispatchMcp, McpError, type ConnectorDefinition } from '@cloud-connectors/core';
import { hashToken } from '@cloud-connectors/storage';
import youtubeConnector from '@cloud-connectors/connector-youtube';
import { getStore } from '@/lib/db';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const CONNECTORS: Record<string, ConnectorDefinition> = {
  youtube: youtubeConnector,
};

let cachedKey: Uint8Array | null = null;
async function getMasterKey(): Promise<Uint8Array> {
  return (cachedKey ??= await loadMasterKey(env.masterKey()));
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (match?.[1]) return match[1].trim();
  }
  return req.nextUrl.searchParams.get('token');
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ connectorId: string }> }) {
  const { connectorId } = await ctx.params;
  const connector = CONNECTORS[connectorId];
  if (!connector) {
    return Response.json({ error: { code: 'not_found', message: 'unknown connector' } }, { status: 404 });
  }
  return Response.json({
    connector: connector.id,
    name: connector.name,
    description: connector.description,
    mcp: { transport: 'streamable-http' },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ connectorId: string }> }) {
  const { connectorId } = await ctx.params;
  const connector = CONNECTORS[connectorId];
  if (!connector) {
    return Response.json({ error: { code: 'not_found', message: 'unknown connector' } }, { status: 404 });
  }

  try {
    const token = extractToken(req);
    if (!token) throw new McpError('unauthorized', 'missing bearer token');
    const store = getStore();
    const resolved = await store.resolveToken(hashToken(token));
    if (!resolved) throw new McpError('unauthorized', 'invalid or expired token');
    if (resolved.connection.connectorId !== connectorId) {
      throw new McpError('forbidden', 'token does not match this connector');
    }

    const credential = await decrypt(resolved.connection.encryptedCredential, await getMasterKey());
    void store.touchToken(resolved.token.id);

    const body = await req.json().catch(() => null);
    if (body == null) throw new McpError('invalid_input', 'request body must be JSON');
    const out = await dispatchMcp(connector, {
      body,
      ctx: { credential, userId: resolved.user.id, signal: req.signal },
    });
    if (out == null) return new Response(null, { status: 204 });
    return Response.json(out);
  } catch (err) {
    if (err instanceof McpError) {
      return Response.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    console.error('[mcp dispatcher] error', err);
    return Response.json(
      { error: { code: 'internal', message: 'internal server error' } },
      { status: 500 },
    );
  }
}
