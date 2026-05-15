import type { Connection, McpToken, User } from './schema.js';

export interface ConnectionUpsert {
  userId: string;
  connectorId: string;
  encryptedCredential: Uint8Array;
  metadata?: Record<string, unknown>;
}

export interface IssueTokenInput {
  userId: string;
  connectionId: string;
  tokenHash: string;
  label?: string;
  expiresAt?: Date;
}

export interface ResolvedToken {
  token: McpToken;
  connection: Connection;
  user: User;
}

export interface ConnectionStore {
  upsertUser(input: { email: string; githubId?: string }): Promise<User>;
  upsertConnection(input: ConnectionUpsert): Promise<Connection>;
  listConnections(userId: string): Promise<Connection[]>;
  deleteConnection(userId: string, connectionId: string): Promise<void>;
  issueToken(input: IssueTokenInput): Promise<McpToken>;
  resolveToken(tokenHash: string): Promise<ResolvedToken | null>;
  touchToken(tokenId: string): Promise<void>;
}
