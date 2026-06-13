# Cloud Connectors

An open-source catalog of remote-MCP connectors for the SaaS APIs you actually use - YouTube, Gmail, Microsoft Graph, GitHub, and more on the way. Think of it as a self-hostable take on Composio / Pipedream, built so you can drop a URL into Claude, Cursor, or any MCP-compatible client and start working.

## Status

Early days - the foundation is in place and the first connector is live.

- `connectors/youtube` - deployed on Cloud Run. Speaks MCP `2024-11-05` over streamable-HTTP at `/mcp` and ships three tools: `youtube_search`, `youtube_get_video`, `youtube_list_channel_videos`.
- `connectors/xquik` - read-only X/Twitter data connector. Speaks MCP `2024-11-05` over streamable-HTTP at `/mcp` and ships four tools: `xquik_search_tweets`, `xquik_get_tweet`, `xquik_search_users`, `xquik_get_user`.
- Hosted admin UI + dispatcher - next up.

Contributions, ideas, and connector requests are very welcome - open an issue and say hi.

## Using a connector

Two ways, once a connector is ready:

1. **Hosted** - sign up at the admin UI, paste your credentials, get an MCP URL to drop into your client.
2. **Self-host** - run the connector's Docker image on Azure Container Apps, GCP Cloud Run, AWS Fargate, Render, Fly, or Kubernetes.

## Deploy a connector

Each connector ships a Dockerfile, so you can run it anywhere that runs containers. We also include opinionated one-shot deploy scripts for common targets.

**Google Cloud Run (YouTube)** - the script provisions Artifact Registry, stores your API key in Secret Manager, builds via Cloud Build, and deploys the service:

```bash
export PROJECT_ID=your-gcp-project
export YOUTUBE_API_KEY=your-key   # https://console.cloud.google.com/apis/credentials
./connectors/youtube/deploy/cloudrun.sh
```

When it finishes, the script prints the `/mcp` URL - paste that into your MCP client and you're done.

Optional overrides: `REGION` (default `us-central1`), `SERVICE` (default `youtube-connector`), `REPO` (default `cloud-connectors`). See `connectors/youtube/deploy/cloudrun.sh` for the full sequence.

**Other targets** - Azure Container Apps, AWS Fargate, Render, Fly, Kubernetes: build the image from the connector's Dockerfile and pass the connector's required env vars (e.g. `YOUTUBE_API_KEY`). Reference scripts for these are on the roadmap.

## Repo layout

```
apps/admin              Next.js admin UI + hosted MCP dispatcher
packages/core           defineConnector() framework, MCP+Hono wiring
packages/storage        Drizzle schema + Postgres adapter
packages/crypto         libsodium credential encryption
packages/catalog        connector metadata registry
connectors/youtube      reference connector (YouTube Data API)
connectors/xquik        X/Twitter data connector (Xquik API)
```

## Local development

```bash
nvm use
corepack enable
pnpm install
pnpm dev
```
