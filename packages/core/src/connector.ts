import type { z, ZodTypeAny } from 'zod';

export type AuthSpec =
  | { type: 'apiKey'; envVar?: string; label?: string; placeholder?: string }
  | { type: 'oauth2'; provider: string; scopes: string[] };

export interface ToolContext<TCredential = string> {
  credential: TCredential;
  userId?: string;
  signal?: AbortSignal;
}

export type ToolHandler<I extends ZodTypeAny, O> = (
  input: z.infer<I>,
  ctx: ToolContext,
) => Promise<O>;

export interface ToolDefinition<I extends ZodTypeAny = ZodTypeAny, O = unknown> {
  name: string;
  description: string;
  inputSchema: I;
  handler: ToolHandler<I, O>;
}

export function defineTool<I extends ZodTypeAny, O>(def: ToolDefinition<I, O>): ToolDefinition<I, O> {
  return def;
}

// `any` here is deliberate: the tools array is heterogeneous (each entry has its own
// input/output types) and TypeScript variance prevents widening to `ToolDefinition<ZodTypeAny>`.
export type AnyToolDefinition = ToolDefinition<any, any>;

export interface ConnectorDefinition {
  id: string;
  name: string;
  description: string;
  auth: AuthSpec;
  tools: AnyToolDefinition[];
  homepage?: string;
}

export function defineConnector(def: ConnectorDefinition): ConnectorDefinition {
  if (!/^[a-z][a-z0-9-]*$/.test(def.id)) {
    throw new Error(`connector id must be kebab-case lowercase: got "${def.id}"`);
  }
  return def;
}
