# Cloud Connectors

Open-source catalog of remote-MCP connectors to popular SaaS APIs (YouTube, Gmail, Microsoft Graph, GitHub, …). Modelled after Composio / Pipedream.

Two ways to use a connector:

1. **Hosted** — sign up at the admin UI, paste your credentials, get an MCP URL to drop into Claude / Cursor / any MCP-compatible client.
2. **Self-host** — run the connector's Docker image on Azure Container Apps, GCP Cloud Run, AWS Fargate, Render, Fly, or Kubernetes.

## Repo layout

```
apps/admin              Next.js admin UI + hosted MCP dispatcher
packages/core           defineConnector() framework, MCP+Hono wiring
packages/storage        Drizzle schema + Postgres adapter
packages/crypto         libsodium credential encryption
packages/catalog        connector metadata registry
connectors/youtube      reference connector (YouTube Data API)
```

## Local development

```bash
nvm use
corepack enable
pnpm install
pnpm dev
```

## Status

Foundation milestone in progress. See `/Users/oliviermeirhaeghe/.claude/plans/lucky-mapping-frog.md` for the full plan.
