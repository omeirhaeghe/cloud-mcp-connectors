import { createDatabase, PostgresConnectionStore } from '@cloud-connectors/storage';
import { env } from './env';

let store: PostgresConnectionStore | null = null;

export function getStore(): PostgresConnectionStore {
  if (!store) {
    const db = createDatabase(env.databaseUrl());
    store = new PostgresConnectionStore(db);
  }
  return store;
}
