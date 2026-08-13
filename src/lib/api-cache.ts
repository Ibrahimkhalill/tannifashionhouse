// Client-side, module-level fetch cache.
//
// Each URL is fetched at most once per page load; the result is reused on later
// navigations (Home → product → Home won't refetch). The cache lives only in
// memory, so a hard refresh (Ctrl/Cmd+R) clears it and pulls fresh data — which
// is how admins see their latest changes.
const cache = new Map<string, Promise<unknown>>();

export function cachedJson<T = unknown>(url: string): Promise<T> {
  let entry = cache.get(url);
  if (!entry) {
    entry = fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch((e) => {
        cache.delete(url); // never cache a failed request
        throw e;
      });
    cache.set(url, entry);
  }
  return entry as Promise<T>;
}

// Drop a cached entry (e.g. after an admin mutation) so the next read refetches.
export function invalidate(url: string) {
  cache.delete(url);
}
