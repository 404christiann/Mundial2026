import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolling } from '@/hooks/usePolling';

const INTERVAL_MS = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('usePolling', () => {
  it('fetches immediately on mount when enabled', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('does not fetch on mount when disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: false }));
    await act(async () => {});
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches again after each interval when enabled', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));

    await act(async () => {});
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS); });
    expect(fetcher).toHaveBeenCalledTimes(2);

    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS); });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('stops polling when enabled flips to false', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { rerender } = renderHook(
      ({ enabled }) => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled }),
      { initialProps: { enabled: true } }
    );

    await act(async () => {});
    expect(fetcher).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS * 3); });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('resumes polling when enabled flips back to true', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { rerender } = renderHook(
      ({ enabled }) => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled }),
      { initialProps: { enabled: false } }
    );

    rerender({ enabled: true });
    await act(async () => {});
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('clears interval on unmount', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { unmount } = renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});

    unmount();
    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS * 5); });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('pauses when document.visibilityState becomes hidden', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS * 3); });
    expect(fetcher).toHaveBeenCalledOnce();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('resumes polling when document becomes visible again', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await act(async () => { vi.advanceTimersByTime(INTERVAL_MS); });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('returns data from the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ matches: [] });
    const { result } = renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});
    expect(result.current.data).toEqual({ matches: [] });
  });

  it('returns error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));
    await act(async () => {});
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('network error');
  });

  it('sets isFetching true while fetcher is in flight', async () => {
    let resolve!: (v: string) => void;
    const fetcher = vi.fn().mockImplementation(() => new Promise<string>(r => { resolve = r; }));
    const { result } = renderHook(() => usePolling(fetcher, { intervalMs: INTERVAL_MS, enabled: true }));

    expect(result.current.isFetching).toBe(true);
    await act(async () => { resolve('done'); });
    expect(result.current.isFetching).toBe(false);
  });
});
