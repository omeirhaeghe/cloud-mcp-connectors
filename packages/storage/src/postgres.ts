import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type {
  ConnectionStore,
  ConnectionUpsert,
  IssueTokenInput,
  ResolvedToken,
} from './adapter.js';
import { connections, mcpTokens, users, type Connection, type McpToken, type User } from './schema.js';

export type Database = ReturnType<typeof drizzle>;

export function createDatabase(connectionString: string): Database {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema: { users, connections, mcpTokens } });
}

export class PostgresConnectionStore implements ConnectionStore {
  constructor(private readonly db: Database) {}

  async upsertUser(input: { email: string; githubId?: string }): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({ email: input.email, githubId: input.githubId })
      .onConflictDoUpdate({
        target: users.email,
        set: { githubId: input.githubId },
      })
      .returning();
    if (!row) throw new Error('failed to upsert user');
    return row;
  }

  async upsertConnection(input: ConnectionUpsert): Promise<Connection> {
    const [row] = await this.db
      .insert(connections)
      .values({
        userId: input.userId,
        connectorId: input.connectorId,
        encryptedCredential: input.encryptedCredential,
        metadata: input.metadata ?? {},
      })
      .onConflictDoUpdate({
        target: [connections.userId, connections.connectorId],
        set: {
          encryptedCredential: input.encryptedCredential,
          metadata: input.metadata ?? {},
          updatedAt: sql`now()`,
        },
      })
      .returning();
    if (!row) throw new Error('failed to upsert connection');
    return row;
  }

  async listConnections(userId: string): Promise<Connection[]> {
    return this.db.select().from(connections).where(eq(connections.userId, userId));
  }

  async deleteConnection(userId: string, connectionId: string): Promise<void> {
    await this.db
      .delete(connections)
      .where(and(eq(connections.userId, userId), eq(connections.id, connectionId)));
  }

  async issueToken(input: IssueTokenInput): Promise<McpToken> {
    const [row] = await this.db
      .insert(mcpTokens)
      .values({
        userId: input.userId,
        connectionId: input.connectionId,
        tokenHash: input.tokenHash,
        label: input.label,
        expiresAt: input.expiresAt,
      })
      .returning();
    if (!row) throw new Error('failed to issue token');
    return row;
  }

  async resolveToken(tokenHash: string): Promise<ResolvedToken | null> {
    const rows = await this.db
      .select({
        token: mcpTokens,
        connection: connections,
        user: users,
      })
      .from(mcpTokens)
      .innerJoin(connections, eq(connections.id, mcpTokens.connectionId))
      .innerJoin(users, eq(users.id, mcpTokens.userId))
      .where(eq(mcpTokens.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.token.expiresAt && row.token.expiresAt.getTime() < Date.now()) return null;
    return row;
  }

  async touchToken(tokenId: string): Promise<void> {
    await this.db
      .update(mcpTokens)
      .set({ lastUsedAt: sql`now()` })
      .where(eq(mcpTokens.id, tokenId));
  }
}
