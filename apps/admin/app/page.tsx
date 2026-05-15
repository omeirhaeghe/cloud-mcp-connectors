import Link from 'next/link';
import { CATALOG } from '@cloud-connectors/catalog';
import { auth, signIn, signOut } from '@/auth';

export default async function Home() {
  const session = await auth();
  return (
    <main className="space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Cloud Connectors</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Remote-MCP connectors to popular SaaS APIs.
          </p>
        </div>
        <div>
          {session?.user ? (
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Sign out ({session.user.email})
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn('github', { redirectTo: '/connections' });
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Sign in with GitHub
              </button>
            </form>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((entry) => (
          <Link
            key={entry.id}
            href={`/connect/${entry.id}`}
            className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{entry.name}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  entry.status === 'available'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {entry.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {entry.tagline}
            </p>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500">
              {entry.toolCount > 0 ? `${entry.toolCount} tools` : 'planned'} ·{' '}
              {entry.auth.type === 'oauth2' ? 'OAuth' : 'API key'}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
