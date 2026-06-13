interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  promise?: Promise<T>;
}

const store = new Map<string, CacheEntry<unknown>>();

interface RateLimitState {
  available: number;
  resetInSeconds: number;
}
let rateLimit: RateLimitState | null = null;

export function setRateLimitState(available: number, resetInSeconds: number): void {
  rateLimit = { available, resetInSeconds };
}
export function getRateLimitState(): RateLimitState | null { return rateLimit; }
export function clearRateLimitState(): void { rateLimit = null; }

export function clearCache() {
  store.clear();
  clearRateLimitState();
}

export async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry) {
    if (now < entry.expiresAt) {
      // Rate-limit guard: if available <= 2 and we have a real cached value, extend TTL and return stale
      if (!entry.promise && rateLimit != null && rateLimit.available <= 2) {
        const extendMs = (rateLimit.resetInSeconds > 0 ? rateLimit.resetInSeconds : 30) * 1000;
        store.set(key, { ...entry, expiresAt: entry.expiresAt + extendMs });
        return entry.value;
      }
      return entry.value;
    }
    if (entry.promise) return entry.promise;
    // TTL expired — check rate-limit guard before calling loader
    if (!entry.promise && rateLimit != null && rateLimit.available <= 2) {
      const extendMs = (rateLimit.resetInSeconds > 0 ? rateLimit.resetInSeconds : 30) * 1000;
      store.set(key, { ...entry, expiresAt: now + extendMs });
      return entry.value;
    }
  }

  const promise = loader().then(value => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }).catch(err => {
    store.delete(key);
    throw err;
  });

  store.set(key, { value: undefined as T, expiresAt: 0, promise });
  return promise;
}
