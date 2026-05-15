import { redirect } from 'next/navigation';
import Link from 'next/link';
import { findEntry } from '@cloud-connectors/catalog';
import { auth } from '@/auth';
import { getStore } from '@/lib/db';
import { env } from '@/lib/env';

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; connector?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/');
  const sp = await searchParams;

  const store = getStore();
  const user = await store.upsertUser({ email: session.user.email });
  const connections = await store.listConnections(user.id);
  const baseUrl = env.appUrl();

  return (
    <main className="space-y-8">
      <h1 className="text-2xl font-semibold">Your connections</h1>

      {sp.token && sp.connector && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            Your MCP URL — copy it now, it won&apos;t be shown again:
          </p>
          <code className="mt-2 block break-all rounded bg-white px-2 py-1 text-xs dark:bg-black">
            {`${baseUrl}/mcp/${sp.connector}?token=${sp.token}`}
          </code>
          <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Add this URL to your MCP client (Claude Desktop, Cursor, etc.) as a Streamable HTTP
            server.
          </p>
        </div>
      )}

      {connections.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          No connections yet. <Link className="underline" href="/">Browse the catalog</Link>.
        </p>
      ) : (
        <ul className="space-y-3">
          {connections.map((c) => {
            const entry = findEntry(c.connectorId);
            return (
              <li
                key={c.id}
                className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{entry?.name ?? c.connectorId}</p>
                    <p className="text-xs text-neutral-500">
                      Connected {c.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/connect/${c.connectorId}`}
                    className="text-sm text-blue-600 underline dark:text-blue-400"
                  >
                    Update
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
