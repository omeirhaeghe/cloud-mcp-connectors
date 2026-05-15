import { z, ZodError } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AnyToolDefinition, ConnectorDefinition, ToolContext } from './connector.js';
import { McpError } from './errors.js';

export const MCP_PROTOCOL_VERSION = '2024-11-05';

const JsonRpcRequest = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.unknown().optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequest>;

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export type DispatchInput = {
  body: unknown;
  ctx: ToolContext;
};

export type DispatchOutput = JsonRpcResponse | JsonRpcResponse[] | null;

export async function dispatchMcp(
  connector: ConnectorDefinition,
  { body, ctx }: DispatchInput,
): Promise<DispatchOutput> {
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((req) => handleSingle(connector, req, ctx)));
    const filtered = results.filter((r): r is JsonRpcResponse => r !== null);
    return filtered.length ? filtered : null;
  }
  return handleSingle(connector, body, ctx);
}

async function handleSingle(
  connector: ConnectorDefinition,
  raw: unknown,
  ctx: ToolContext,
): Promise<JsonRpcResponse | null> {
  let req: JsonRpcRequest;
  try {
    req = JsonRpcRequest.parse(raw);
  } catch (err) {
    return rpcError(null, -32600, 'Invalid Request', err);
  }
  const id = req.id ?? null;
  const isNotification = req.id === undefined || req.id === null;

  try {
    switch (req.method) {
      case 'initialize':
        return rpcResult(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: connector.name, version: '0.1.0' },
        });
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return null;
      case 'ping':
        return rpcResult(id, {});
      case 'tools/list':
        return rpcResult(id, { tools: serializeTools(connector.tools) });
      case 'tools/call': {
        const params = z
          .object({ name: z.string(), arguments: z.unknown().optional() })
          .parse(req.params);
        const tool = connector.tools.find((t) => t.name === params.name);
        if (!tool) throw new McpError('not_found', `unknown tool: ${params.name}`);
        const input = tool.inputSchema.parse(params.arguments ?? {});
        const result = await tool.handler(input, ctx);
        return rpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        });
      }
      default:
        if (isNotification) return null;
        return rpcError(id, -32601, `method not found: ${req.method}`);
    }
  } catch (err) {
    if (isNotification) return null;
    if (err instanceof McpError) return rpcError(id, mcpErrorCode(err), err.message);
    if (err instanceof ZodError) return rpcError(id, -32602, 'Invalid params', err.issues);
    return rpcError(id, -32603, err instanceof Error ? err.message : String(err));
  }
}

function serializeTools(tools: AnyToolDefinition[]): unknown[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema, { target: 'jsonSchema7' }),
  }));
}

function mcpErrorCode(err: McpError): number {
  switch (err.code) {
    case 'invalid_input':
      return -32602;
    case 'not_found':
      return -32601;
    default:
      return -32000;
  }
}

function rpcResult(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}
