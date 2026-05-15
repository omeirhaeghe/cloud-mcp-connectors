import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@cloud-connectors/crypto': here('./packages/crypto/src/index.ts'),
      '@cloud-connectors/storage': here('./packages/storage/src/index.ts'),
      '@cloud-connectors/storage/schema': here('./packages/storage/src/schema.ts'),
      '@cloud-connectors/core': here('./packages/core/src/index.ts'),
      '@cloud-connectors/catalog': here('./packages/catalog/src/index.ts'),
      '@cloud-connectors/connector-youtube': here('./connectors/youtube/src/index.ts'),
    },
  },
});
