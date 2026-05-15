import { decrypt, loadMasterKey } from '@cloud-connectors/crypto';
import { hashToken, type ConnectionStore } from '@cloud-connectors/storage';
import type { Context, MiddlewareHandler } from 'hono';
import { McpError } from './errors.js';

export interface AuthContext {
  credential: string;
  userId: string;
  connectionId: string;
}

export interface AuthMiddlewareOptions {
  store: ConnectionStore;
  masterKeyBase64: string;
  connectorId: string;
}

const AUTH_KEY = 'cc_auth' as const;

export function bearerAuth(opts: AuthMiddlewareOptions): MiddlewareHandler {
  let cachedKey: Uint8Array | null = null;
  const getKey = async () => (cachedKey ??= await loadMasterKey(opts.masterKeyBase64));

  return async (c, next) => {
    const token = extractBearer(c);
    if (!token) throw new McpError('unauthorized', 'missing bearer token');

    const tokenHash = hashToken(token);
    const resolved = await opts.store.resolveToken(tokenHash);
    if (!resolved) throw new McpError('unauthorized', 'invalid or expired token');
    if (resolved.connection.connectorId !== opts.connectorId) {
      throw new McpError('forbidden', 'token does not match this connector');
    }

    const masterKey = await getKey();
    const credential = await decrypt(resolved.connection.encryptedCredential, masterKey);

    const auth: AuthContext = {
      credential,
      userId: resolved.user.id,
      connectionId: resolved.connection.id,
    };
    c.set(AUTH_KEY, auth);
    void opts.store.touchToken(resolved.token.id);
    await next();
  };
}

export function getAuth(c: Context): AuthContext {
  const auth = c.get(AUTH_KEY) as AuthContext | undefined;
  if (!auth) throw new McpError('unauthorized', 'auth context missing');
  return auth;
}

export function extractBearer(c: Context): string | null {
  const header = c.req.header('authorization') ?? c.req.header('Authorization');
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match?.[1]) return match[1].trim();
  }
  const queryToken = c.req.query('token');
  return queryToken ?? null;
}
