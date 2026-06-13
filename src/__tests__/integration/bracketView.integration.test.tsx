/**
 * Integration: buildBracket → BracketView → BracketColumn → BracketMatch
 *
 * Tests that match data flows through the full bracket render pipeline:
 * buildBracket output → BracketView (via useBracket) → BracketColumn labels
 * → BracketMatch rendering (TBD slots, winner bold, LiveDot).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BracketView } from '@/components/bracket/BracketView';
import { buildBracket } from '@/lib/bracket';
import { makeMatch, makeLiveMatch, makeFinishedMatch, makeBracketRound } from '../fixtures';
import type { BracketRound } from '@/types/domain';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/bracket',
}));

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'visible',
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── All 6 round labels ───────────────────────────────────────────────────────

describe('BracketView — all 6 round labels from buildBracket', () => {
  it('renders all 6 round labels when given an empty match list', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);
    expect(screen.getByText('Round of 32')).toBeDefined();
    expect(screen.getByText('Round of 16')).toBeDefined();
    expect(screen.getByText('Quarter Finals')).toBeDefined();
    expect(screen.getByText('Semi Finals')).toBeDefined();
    expect(screen.getByText('Third Place')).toBeDefined();
    expect(screen.getByText('Final')).toBeDefined();
  });

  it('renders all 6 round labels when rounds are passed directly', () => {
    const rounds: BracketRound[] = [
      makeBracketRound({ stage: 'ROUND_OF_32', label: 'Round of 32', matches: [] }),
      makeBracketRound({ stage: 'ROUND_OF_16', label: 'Round of 16', matches: [] }),
      makeBracketRound({ stage: 'QUARTER_FINALS', label: 'Quarter Finals', matches: [] }),
      makeBracketRound({ stage: 'SEMI_FINALS', label: 'Semi Finals', matches: [] }),
      makeBracketRound({ stage: 'THIRD_PLACE', label: 'Third Place', matches: [] }),
      makeBracketRound({ stage: 'FINAL', label: 'Final', matches: [] }),
    ];
    render(<BracketView initialRounds={rounds} />);
    expect(screen.getByText('Round of 32')).toBeDefined();
    expect(screen.getByText('Final')).toBeDefined();
  });
});

// ─── TBD slots ───────────────────────────────────────────────────────────────

describe('BracketView → BracketColumn → BracketMatch — TBD slots', () => {
  it('shows TBD slots in all empty rounds from an empty bracket', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);
    const tbdEls = screen.getAllByText('TBD');
    // 6 rounds × 2 TBD divs each = 12
    expect(tbdEls.length).toBe(12);
  });

  it('shows TBD for a round with no matches, real matches for round with data', () => {
    const r32Match = makeMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'Portugal', tla: 'POR', crest: null },
    });
    const rounds = buildBracket([r32Match]);
    render(<BracketView initialRounds={rounds} />);
    // R32 has a real match
    expect(screen.getAllByText('Argentina').length).toBeGreaterThan(0);
    // R16 through FINAL should be TBD (5 rounds × 2 = 10)
    expect(screen.getAllByText('TBD').length).toBe(10);
  });
});

// ─── Winner highlighting ──────────────────────────────────────────────────────

describe('BracketView → BracketMatch — winner highlighting', () => {
  it('applies "winner" class to the home team when home wins', () => {
    const match = makeFinishedMatch({
      id: 100,
      stage: 'FINAL',
      group: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'France', tla: 'FRA', crest: null },
      winner: 'HOME',
    });
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    const argentinaEl = screen.getByText('Argentina');
    expect(argentinaEl.className).toContain('winner');
  });

  it('applies "winner" class to the away team when away wins', () => {
    const match = makeFinishedMatch({
      id: 100,
      stage: 'FINAL',
      group: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'France', tla: 'FRA', crest: null },
      winner: 'AWAY',
      fullTime: { home: 0, away: 1 },
    });
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    const franceEl = screen.getByText('France');
    expect(franceEl.className).toContain('winner');
    const argentinaEl = screen.getByText('Argentina');
    expect(argentinaEl.className).not.toContain('winner');
  });

  it('renders fullTime scores for a finished knockout match', () => {
    const match = makeFinishedMatch({
      id: 100,
      stage: 'FINAL',
      group: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'France', tla: 'FRA', crest: null },
      fullTime: { home: 3, away: 2 },
      winner: 'HOME',
    });
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });
});

// ─── LiveDot in bracket ───────────────────────────────────────────────────────

describe('BracketView → BracketMatch → LiveDot', () => {
  it('shows LiveDot for a live knockout match', () => {
    const match = makeLiveMatch({
      id: 100,
      stage: 'SEMI_FINALS',
      group: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    expect(screen.getByTestId('live-dot')).toBeDefined();
  });

  it('does NOT show LiveDot for a finished knockout match', () => {
    const match = makeFinishedMatch({
      id: 100,
      stage: 'SEMI_FINALS',
      group: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });
});

// ─── Bracket round ordering ───────────────────────────────────────────────────

describe('buildBracket → BracketView — round ordering preserved', () => {
  it('renders rounds in canonical order R32 → R16 → QF → SF → 3rd → Final', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);
    const headers = screen
      .getAllByRole('heading', { level: 3 })
      .map(h => h.textContent?.trim());
    expect(headers).toEqual([
      'Round of 32',
      'Round of 16',
      'Quarter Finals',
      'Semi Finals',
      'Third Place',
      'Final',
    ]);
  });
});

// ─── Polling integration ─────────────────────────────────────────────────────

describe('BracketView — polling via useBracket', () => {
  it('polls /api/bracket when a live knockout match exists', async () => {
    const liveMatch = makeLiveMatch({
      id: 100,
      stage: 'QUARTER_FINALS',
      group: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });
    const finishedMatch = makeFinishedMatch({
      id: 100,
      stage: 'QUARTER_FINALS',
      group: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });
    const updatedRounds = buildBracket([finishedMatch]);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rounds: updatedRounds }), { status: 200 }),
    );

    const rounds = buildBracket([liveMatch]);
    render(<BracketView initialRounds={rounds} />);

    // Flush the immediate runFetch() that fires when isLive=true
    await act(async () => {});

    expect(fetch).toHaveBeenCalledWith('/api/bracket');
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('does NOT poll when all matches are finished', () => {
    const finished = makeFinishedMatch({
      id: 100,
      stage: 'FINAL',
      group: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const rounds = buildBracket([finished]);
    render(<BracketView initialRounds={rounds} />);

    vi.advanceTimersByTime(120_000);
    expect(mockFetch).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
