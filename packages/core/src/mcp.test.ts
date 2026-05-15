import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConnector, defineTool } from './connector.js';
import { dispatchMcp, MCP_PROTOCOL_VERSION } from './mcp.js';

const echo = defineTool({
  name: 'echo',
  description: 'echoes the input',
  inputSchema: z.object({ text: z.string() }),
  handler: async ({ text }, { credential }) => ({ text, credential }),
});

const failing = defineTool({
  name: 'fail',
  description: 'always throws',
  inputSchema: z.object({}),
  handler: async () => {
    throw new Error('boom');
  },
});

const connector = defineConnector({
  id: 'test',
  name: 'Test',
  description: 'test connector',
  auth: { type: 'apiKey' },
  tools: [echo, failing],
});

const ctx = { credential: 'sk-test' };

describe('dispatchMcp', () => {
  it('initialize returns protocol version + serverInfo', async () => {
    const res = await dispatchMcp(connector, {
      body: { jsonrpc: '2.0', id: 1, method: 'initialize' },
      ctx,
    });
    expect(res).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: { name: 'Test' },
      },
    });
  });

  it('tools/list returns serialized tools', async () => {
    const res = await dispatchMcp(connector, {
      body: { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ctx,
    });
    const result = (res as { result: { tools: { name: string }[] } }).result;
    expect(result.tools.map((t) => t.name)).toEqual(['echo', 'fail']);
    expect(result.tools[0]).toHaveProperty('inputSchema');
  });

  it('tools/call invokes handler with parsed input', async () => {
    const res = await dispatchMcp(connector, {
      body: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'echo', arguments: { text: 'hello' } },
      },
      ctx,
    });
    expect(res).toMatchObject({
      id: 3,
      result: { structuredContent: { text: 'hello', credential: 'sk-test' } },
    });
  });

  it('returns -32602 for invalid params', async () => {
    const res = await dispatchMcp(connector, {
      body: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'echo', arguments: {} },
      },
      ctx,
    });
    expect(res).toMatchObject({ id: 4, error: { code: -32602 } });
  });

  it('handles batch requests', async () => {
    const res = await dispatchMcp(connector, {
      body: [
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        { jsonrpc: '2.0', id: 2, method: 'ping' },
      ],
      ctx,
    });
    expect(Array.isArray(res)).toBe(true);
    expect((res as unknown[]).length).toBe(2);
  });

  it('drops notifications (no id)', async () => {
    const res = await dispatchMcp(connector, {
      body: { jsonrpc: '2.0', method: 'notifications/initialized' },
      ctx,
    });
    expect(res).toBeNull();
  });

  it('returns -32603 for handler exception', async () => {
    const res = await dispatchMcp(connector, {
      body: {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'fail', arguments: {} },
      },
      ctx,
    });
    expect(res).toMatchObject({ id: 9, error: { code: -32603, message: 'boom' } });
  });
});
