import { notFound, redirect } from 'next/navigation';
import { findEntry } from '@cloud-connectors/catalog';
import { encrypt, loadMasterKey } from '@cloud-connectors/crypto';
import { generateOpaqueToken, hashToken } from '@cloud-connectors/storage';
import { auth, signIn } from '@/auth';
import { getStore } from '@/lib/db';
import { env } from '@/lib/env';

export default async function ConnectPage({
  params,
}: {
  params: Promise<{ connectorId: string }>;
}) {
  const { connectorId } = await params;
  const entry = findEntry(connectorId);
  if (!entry) notFound();

  const session = await auth();
  if (!session?.user?.email) {
    return (
      <main className="space-y-6">
        <h1 className="text-2xl font-semibold">{entry.name}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Sign in to connect this service.</p>
        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: `/connect/${connectorId}` });
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
          >
            Sign in with GitHub
          </button>
        </form>
      </main>
    );
  }

  if (entry.status !== 'available') {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">{entry.name}</h1>
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This connector is <strong>{entry.status}</strong> and not yet available.
        </p>
      </main>
    );
  }

  if (entry.auth.type !== 'apiKey') {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">{entry.name}</h1>
        <p>OAuth connectors arrive in Milestone 2.</p>
      </main>
    );
  }

  async function connect(formData: FormData) {
    'use server';
    const apiKey = String(formData.get('apiKey') ?? '').trim();
    if (!apiKey) throw new Error('API key required');

    const session = await auth();
    if (!session?.user?.email) redirect('/');

    const store = getStore();
    const user = await store.upsertUser({ email: session.user.email });
    const masterKey = await loadMasterKey(env.masterKey());
    const ciphertext = await encrypt(apiKey, masterKey);
    const connection = await store.upsertConnection({
      userId: user.id,
      connectorId,
      encryptedCredential: ciphertext,
    });
    const rawToken = generateOpaqueToken(32);
    await store.issueToken({
      userId: user.id,
      connectionId: connection.id,
      tokenHash: hashToken(rawToken),
      label: 'admin-issued',
    });
    redirect(`/connections?token=${rawToken}&connector=${connectorId}`);
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Connect {entry.name}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">{entry.description}</p>
      <form action={connect} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="apiKey">
          {entry.auth.label}
        </label>
        <input
          id="apiKey"
          name="apiKey"
          type="password"
          required
          placeholder={entry.auth.placeholder}
          autoComplete="off"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {entry.auth.docsUrl && (
          <p className="text-xs text-neutral-500">
            <a className="underline" href={entry.auth.docsUrl} target="_blank" rel="noreferrer">
              How to get an API key
            </a>
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Save & generate MCP URL
        </button>
      </form>
    </main>
  );
}
