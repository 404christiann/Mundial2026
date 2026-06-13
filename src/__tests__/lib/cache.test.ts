import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withTtlCache } from '@/lib/football/cache';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('withTtlCache', () => {
  it('calls the loader on first access', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    const result = await withTtlCache('key1', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();
    expect(result).toBe('data');
  });

  it('returns cached value without calling loader on second access within TTL', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    await withTtlCache('key2', 60_000, loader);
    await withTtlCache('key2', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('calls loader again after TTL expires', async () => {
    const loader = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    await withTtlCache('key3', 60_000, loader);

    vi.advanceTimersByTime(61_000);

    const result = await withTtlCache('key3', 60_000, loader);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(result).toBe('second');
  });

  it('does not call loader again just before TTL expires', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    await withTtlCache('key4', 60_000, loader);

    vi.advanceTimersByTime(59_000);

    await withTtlCache('key4', 60_000, loader);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('uses separate cache entries for different keys', async () => {
    const loaderA = vi.fn().mockResolvedValue('A');
    const loaderB = vi.fn().mockResolvedValue('B');

    const resultA = await withTtlCache('keyA', 60_000, loaderA);
    const resultB = await withTtlCache('keyB', 60_000, loaderB);

    expect(resultA).toBe('A');
    expect(resultB).toBe('B');
    expect(loaderA).toHaveBeenCalledOnce();
    expect(loaderB).toHaveBeenCalledOnce();
  });

  it('propagates loader errors without caching the failure', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('upstream down'))
      .mockResolvedValueOnce('recovered');

    await expect(withTtlCache('key5', 60_000, loader)).rejects.toThrow('upstream down');
    const result = await withTtlCache('key5', 60_000, loader);
    expect(result).toBe('recovered');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('handles concurrent calls with the same key (deduplication)', async () => {
    let resolveLoader!: (v: string) => void;
    const loader = vi.fn().mockImplementation(
      () => new Promise<string>(resolve => { resolveLoader = resolve; })
    );

    const [p1, p2] = [
      withTtlCache('key6', 60_000, loader),
      withTtlCache('key6', 60_000, loader),
    ];
    resolveLoader('value');
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(loader).toHaveBeenCalledOnce();
    expect(r1).toBe('value');
    expect(r2).toBe('value');
  });
});
