import { MemoryStore } from "./memory-store";
import { PostgresStore } from "./postgres-store";
import { type FlagStore } from "./types";

export async function createStore(): Promise<FlagStore> {
  if (!process.env.DATABASE_URL) {
    return new MemoryStore();
  }

  const store = new PostgresStore(process.env.DATABASE_URL);
  await store.init();
  return store;
}
