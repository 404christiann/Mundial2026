import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBracket } from '@/hooks/useBracket';
import { makeBracketRound, makeLiveMatch, makeFinishedMatch, makeMatch } from '../fixtures';

const POLL_MS = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ rounds: [] }), { status: 200 })
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useBracket', () => {
  it('seeds initial rounds without fetching', () => {
    const initial = [makeBracketRound({ stage: 'ROUND_OF_32' })];
    const { result } = renderHook(() => useBracket(initial));
    expect(result.current.rounds).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not poll when all knockout matches are complete', async () => {
    const initial = [
      makeBracketRound({ matches: [makeFinishedMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    renderHook(() => useBracket(initial));
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 3); });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('polls while knockout matches are scheduled so full-time winners can move dynamically', async () => {
    const initial = [
      makeBracketRound({ matches: [makeMatch({ id: 1, status: 'TIMED', stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    renderHook(() => useBracket(initial));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('starts polling immediately when a bracket match is IN_PLAY', async () => {
    const initial = [
      makeBracketRound({ matches: [makeLiveMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    renderHook(() => useBracket(initial));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('polls /api/bracket endpoint', async () => {
    const initial = [
      makeBracketRound({ matches: [makeLiveMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    renderHook(() => useBracket(initial));
    await act(async () => {});
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/bracket'));
  });

  it('updates rounds from poll response', async () => {
    const initial = [
      makeBracketRound({ stage: 'ROUND_OF_32', matches: [makeLiveMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    const updatedRounds = [
      makeBracketRound({ stage: 'ROUND_OF_32', matches: [makeFinishedMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rounds: updatedRounds }), { status: 200 })
    );

    const { result } = renderHook(() => useBracket(initial));
    await act(async () => {});
    expect(result.current.rounds[0].matches[0].status).toBe('FINISHED');
  });

  it('sets isLive false and stops polling when last live match finishes', async () => {
    const initial = [
      makeBracketRound({ matches: [makeLiveMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    const finishedRounds = [
      makeBracketRound({ matches: [makeFinishedMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rounds: finishedRounds }), { status: 200 })
    );

    const { result } = renderHook(() => useBracket(initial));
    await act(async () => {});

    expect(result.current.isLive).toBe(false);
    expect(result.current.isTracking).toBe(false);

    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 3); });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });

  it('isLive is true when at least one bracket match is IN_PLAY', () => {
    const initial = [
      makeBracketRound({ matches: [makeLiveMatch({ stage: 'SEMI_FINALS', matchday: null, group: null })] }),
    ];
    const { result } = renderHook(() => useBracket(initial));
    expect(result.current.isLive).toBe(true);
  });

  it('isLive is false when all bracket matches are finished', () => {
    const initial = [
      makeBracketRound({ matches: [makeFinishedMatch({ stage: 'FINAL', matchday: null, group: null })] }),
    ];
    const { result } = renderHook(() => useBracket(initial));
    expect(result.current.isLive).toBe(false);
    expect(result.current.isTracking).toBe(false);
  });

  it('isLive is false when rounds have no matches (pre-knockout)', () => {
    const initial = [makeBracketRound({ matches: [] })];
    const { result } = renderHook(() => useBracket(initial));
    expect(result.current.isLive).toBe(false);
    expect(result.current.isTracking).toBe(false);
  });

  it('cleans up polling on unmount', async () => {
    const initial = [
      makeBracketRound({ matches: [makeLiveMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null })] }),
    ];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rounds: initial }), { status: 200 })
    );

    const { unmount } = renderHook(() => useBracket(initial));
    await act(async () => {});
    unmount();

    const callCount = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(POLL_MS * 5); });
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
  });
});
