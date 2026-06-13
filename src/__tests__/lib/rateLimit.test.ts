import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withTtlCache,
  setRateLimitState,
  getRateLimitState,
  clearRateLimitState,
  clearCache,
} from '@/lib/football/cache';

beforeEach(() => {
  vi.useFakeTimers();
  clearCache(); // also clears rateLimit state
});

afterEach(() => {
  vi.useRealTimers();
  clearCache();
});

describe('setRateLimitState / getRateLimitState round-trip', () => {
  it('stores and retrieves rate-limit state', () => {
    expect(getRateLimitState()).toBeNull();
    setRateLimitState(5, 60);
    expect(getRateLimitState()).toEqual({ available: 5, resetInSeconds: 60 });
  });

  it('clearRateLimitState resets to null', () => {
    setRateLimitState(1, 30);
    clearRateLimitState();
    expect(getRateLimitState()).toBeNull();
  });
});

describe('withTtlCache — rate-limit guard (available <= 2, cached entry exists)', () => {
  it('returns cached value without calling loader even after TTL expired when available <= 2', async () => {
    const loader = vi.fn().mockResolvedValue('cached-data');
    // Populate cache
    await withTtlCache('rl-key1', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();

    // Expire the TTL
    vi.advanceTimersByTime(61_000);

    // Set rate-limit: available = 2
    setRateLimitState(2, 45);

    const loader2 = vi.fn().mockResolvedValue('fresh-data');
    const result = await withTtlCache('rl-key1', 60_000, loader2);

    // Should return stale cached value, not call loader2
    expect(loader2).not.toHaveBeenCalled();
    expect(result).toBe('cached-data');
  });

  it('returns stale value (available = 1) without calling loader', async () => {
    const loader = vi.fn().mockResolvedValue('stale');
    await withTtlCache('rl-key2', 60_000, loader);
    vi.advanceTimersByTime(61_000);

    setRateLimitState(1, 30);
    const result = await withTtlCache('rl-key2', 60_000, vi.fn());
    expect(result).toBe('stale');
  });

  it('extends TTL by resetInSeconds * 1000 when rate-limited', async () => {
    const loader = vi.fn().mockResolvedValue('v1');
    await withTtlCache('rl-key3', 60_000, loader);

    // Expire original TTL
    vi.advanceTimersByTime(61_000);
    setRateLimitState(2, 45);

    // This should extend TTL by 45 * 1000 = 45s
    await withTtlCache('rl-key3', 60_000, vi.fn().mockResolvedValue('v2'));

    // Advance 44s — still in extended window, loader should NOT be called
    vi.advanceTimersByTime(44_000);
    clearRateLimitState(); // clear rate-limit so we're testing TTL only
    const loader3 = vi.fn().mockResolvedValue('v3');
    const result = await withTtlCache('rl-key3', 60_000, loader3);
    expect(loader3).not.toHaveBeenCalled();
    expect(result).toBe('v1');
  });

  it('falls back to 30s extension when resetInSeconds is 0', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    await withTtlCache('rl-key4', 60_000, loader);
    vi.advanceTimersByTime(61_000);

    setRateLimitState(2, 0); // resetInSeconds = 0 → fallback to 30s
    await withTtlCache('rl-key4', 60_000, vi.fn());

    // Advance 29s — should still be within extended 30s window
    vi.advanceTimersByTime(29_000);
    clearRateLimitState();
    const result = await withTtlCache('rl-key4', 60_000, vi.fn());
    expect(result).toBe('data');
  });
});

describe('withTtlCache — cold cache: loader still called even when available <= 2', () => {
  it('calls loader on cold cache even if rate-limited', async () => {
    setRateLimitState(2, 30);
    const loader = vi.fn().mockResolvedValue('fresh');
    const result = await withTtlCache('cold-key', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();
    expect(result).toBe('fresh');
  });

  it('calls loader on cold cache when available = 0', async () => {
    setRateLimitState(0, 60);
    const loader = vi.fn().mockResolvedValue('result');
    await withTtlCache('cold-key2', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();
  });
});

describe('withTtlCache — normal behavior when available > 2', () => {
  it('calls loader after TTL when available > 2', async () => {
    const loader = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    await withTtlCache('norm-key', 60_000, loader);

    vi.advanceTimersByTime(61_000);
    setRateLimitState(3, 30); // available = 3 → normal behavior

    const result = await withTtlCache('norm-key', 60_000, loader);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(result).toBe('second');
  });
});

describe('clearCache resets rate-limit state to null', () => {
  it('clears rateLimit state when clearCache is called', () => {
    setRateLimitState(1, 30);
    expect(getRateLimitState()).not.toBeNull();
    clearCache();
    expect(getRateLimitState()).toBeNull();
  });
});
