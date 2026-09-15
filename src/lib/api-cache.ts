// Client-side fetch cache with memory + sessionStorage persistence.
//
// - Memory cache: avoids duplicate in-flight / repeated requests during one tab life.
// - sessionStorage cache: survives soft/hard navigations in the same tab.
// Hard refresh still keeps sessionStorage for the tab until closed.
const cache = new Map<string, Promise<unknown>>();
const KEY_PREFIX = "shopbd:api:";
const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheOpts = {
  ttlMs?: number;
  persistent?: boolean;
};

type StoredEntry = { ts: number; data: unknown };

function readStored(url: string, ttlMs: number): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + url);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry;
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > ttlMs) {
      sessionStorage.removeItem(KEY_PREFIX + url);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStored(url: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      KEY_PREFIX + url,
      JSON.stringify({ ts: Date.now(), data } satisfies StoredEntry),
    );
  } catch {}
}

export function cachedJson<T = unknown>(url: string, opts: CacheOpts = {}): Promise<T> {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const persistent = opts.persistent ?? true;

  const inMemory = cache.get(url);
  if (inMemory) return inMemory as Promise<T>;

  if (persistent) {
    const stored = readStored(url, ttlMs);
    if (stored !== null) {
      const resolved = Promise.resolve(stored);
      cache.set(url, resolved);
      return resolved as Promise<T>;
    }
  }

  const entry = fetch(url)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      if (persistent) writeStored(url, data);
      return data;
    })
    .catch((e) => {
      cache.delete(url);
      throw e;
    });

  cache.set(url, entry);
  return entry as Promise<T>;
}

// Drop a cached entry (e.g. after an admin mutation) so the next read refetches.
export function invalidate(url: string) {
  cache.delete(url);
  if (typeof window !== "undefined") {
    try { sessionStorage.removeItem(KEY_PREFIX + url); } catch {}
  }
}
