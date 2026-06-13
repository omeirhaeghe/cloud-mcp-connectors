# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prune
WORKDIR /repo
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/crypto packages/crypto
COPY packages/storage packages/storage
COPY packages/core packages/core
COPY connectors/xquik connectors/xquik

FROM base AS deps
WORKDIR /repo
COPY --from=prune /repo/ ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile=false

FROM base AS build
WORKDIR /repo
COPY --from=deps /repo ./
RUN pnpm --filter '@cloud-connectors/crypto' --filter '@cloud-connectors/storage' \
        --filter '@cloud-connectors/core' --filter '@cloud-connectors/connector-xquik' \
        run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=4002
WORKDIR /app
RUN corepack enable
COPY --from=build /repo /app
EXPOSE 4002
WORKDIR /app/connectors/xquik
CMD ["node", "dist/dev-server.js"]
