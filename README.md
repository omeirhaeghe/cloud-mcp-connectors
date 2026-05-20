# Cloud Connectors

An open-source catalog of remote-MCP connectors for the SaaS APIs you actually use — YouTube, Gmail, Microsoft Graph, GitHub, and more on the way. Think of it as a self-hostable take on Composio / Pipedream, built so you can drop a URL into Claude, Cursor, or any MCP-compatible client and start working.

## Status

Early days — the foundation is in place and the first connector is live.

- `connectors/youtube` — deployed on Cloud Run. Speaks MCP `2024-11-05` over streamable-HTTP at `/mcp` and ships three tools: `youtube_search`, `youtube_get_video`, `youtube_list_channel_videos`.
- Hosted admin UI + dispatcher — next up.

Contributions, ideas, and connector requests are very welcome — open an issue and say hi.

## Using a connector

Two ways, once a connector is ready:

1. **Hosted** — sign up at the admin UI, paste your credentials, get an MCP URL to drop into your client.
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
