// Env helpers return '' when missing rather than throwing, so `next build` can
// statically analyze routes without all secrets present. Real validation happens
// at request time via the libraries that consume these values.
function get(name: string): string {
  return process.env[name] ?? '';
}

export const env = {
  databaseUrl: () => get('DATABASE_URL'),
  masterKey: () => get('MASTER_ENCRYPTION_KEY'),
  appUrl: () => process.env.APP_URL ?? 'http://localhost:3000',
  authSecret: () => get('AUTH_SECRET'),
  githubClientId: () => get('AUTH_GITHUB_ID'),
  githubClientSecret: () => get('AUTH_GITHUB_SECRET'),
};
