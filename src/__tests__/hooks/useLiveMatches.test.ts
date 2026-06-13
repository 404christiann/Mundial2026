import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { makeMatch, makeLiveMatch, makeFinishedMatch } from '../fixtures';

const POLL_MS = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ matches: [] }), { status: 200 })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useLiveMatches', () => {
  it('seeds initial data without fetching', () => {
    const initial = [makeMatch({ id: 1 })];
    const { result } = renderHook(() => useLiveMatches('2026-06-13', initial));
    expect(result.current.matches).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not poll when no initial matches are live', async () => {
    const initial = [makeFinishedMatch({ id: 1 })];
    renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 3); });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('starts polling immediately when an initial match is IN_PLAY', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('polls /api/matches with the correct date query', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('date=2026-06-13'));
  });

  it('updates matches from poll response', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    const updated = makeFinishedMatch({ id: 1 });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ matches: [updated] }), { status: 200 })
    );

    const { result } = renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    expect(result.current.matches[0].status).toBe('FINISHED');
  });

  it('sets isLive false and stops polling when last live match becomes FINISHED', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    const finished = makeFinishedMatch({ id: 1 });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ matches: [finished] }), { status: 200 })
    );

    const { result } = renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});

    expect(result.current.isLive).toBe(false);

    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 3); });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('continues polling at each interval while matches remain live', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ matches: [makeLiveMatch({ id: 1 })] }), { status: 200 })
    );

    renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    await act(async () => { vi.advanceTimersByTime(POLL_MS); });
    await act(async () => { vi.advanceTimersByTime(POLL_MS); });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('sets lastUpdated timestamp after a successful poll', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    const { result } = renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    expect(result.current.lastUpdated).toBeTypeOf('number');
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it('lastUpdated is null before first poll', () => {
    const initial = [makeFinishedMatch({ id: 1 })];
    const { result } = renderHook(() => useLiveMatches('2026-06-13', initial));
    expect(result.current.lastUpdated).toBeNull();
  });

  it('cleans up polling interval on unmount', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ matches: [makeLiveMatch({ id: 1 })] }), { status: 200 })
    );

    const { unmount } = renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    unmount();

    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 5); });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('does not update state after unmount (no state update on stale async)', async () => {
    const initial = [makeLiveMatch({ id: 1 })];
    let resolveDelayed!: () => void;
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(resolve => {
        resolveDelayed = () => resolve(new Response(JSON.stringify({ matches: [] }), { status: 200 }));
      })
    );

    const { unmount } = renderHook(() => useLiveMatches('2026-06-13', initial));
    await act(async () => {});
    unmount();
    await act(async () => { resolveDelayed(); });
    // No assertion needed; test passes if no "state update on unmounted component" warning/error
  });
});
