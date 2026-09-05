type Entry<T> = { data: T; ts: number; ttl: number };

const store = new Map<string, Entry<unknown>>();

function isExpired(e: Entry<unknown>): boolean {
  return Date.now() - e.ts > e.ttl;
}

export const appCache = {
  get<T>(key: string): T | null {
    const e = store.get(key) as Entry<T> | undefined;
    if (!e) return null;
    if (isExpired(e)) {
      store.delete(key);
      return null;
    }
    return e.data;
  },

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    store.set(key, { data, ts: Date.now(), ttl });
  },

  delete(key: string): void {
    store.delete(key);
  },

  clear(): void {
    store.clear();
  },
};
