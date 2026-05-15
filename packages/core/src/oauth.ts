import type { AuthSpec } from './connector.js';

export interface OAuthFlowConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export function buildAuthorizationUrl(config: OAuthFlowConfig, state: string): string {
  const url = new URL(config.authorizationUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', config.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

export async function exchangeCodeForTokens(
  config: OAuthFlowConfig,
  code: string,
): Promise<OAuthTokens> {
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed (${res.status}): ${await res.text()}`);
  return parseTokenResponse(await res.json());
}

export async function refreshTokens(
  config: OAuthFlowConfig,
  refreshToken: string,
): Promise<OAuthTokens> {
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed (${res.status}): ${await res.text()}`);
  return { ...parseTokenResponse(await res.json()), refreshToken };
}

function parseTokenResponse(json: unknown): OAuthTokens {
  const obj = json as Record<string, unknown>;
  const accessToken = String(obj.access_token ?? '');
  if (!accessToken) throw new Error('token response missing access_token');
  const refreshToken = obj.refresh_token ? String(obj.refresh_token) : undefined;
  const expiresIn = typeof obj.expires_in === 'number' ? obj.expires_in : undefined;
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
    scope: obj.scope ? String(obj.scope) : undefined,
  };
}

export function isOAuthConnector(auth: AuthSpec): auth is Extract<AuthSpec, { type: 'oauth2' }> {
  return auth.type === 'oauth2';
}
