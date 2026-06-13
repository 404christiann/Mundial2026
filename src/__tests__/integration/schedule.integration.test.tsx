/**
 * Integration: ScheduleView → DatePager + MatchList → MatchCard + LiveDot
 *
 * Tests the full render chain when real Match domain objects flow from
 * initialMatches through useLiveMatches into MatchList and finally MatchCard.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { makeMatch, makeLiveMatch, makeFinishedMatch } from '../fixtures';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/schedule',
}));

beforeEach(() => {
  mockPush.mockReset();
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

// ─── DatePager + label rendering ─────────────────────────────────────────────

describe('ScheduleView — DatePager renders correct date label', () => {
  it('displays a human-readable date label from the date prop', () => {
    render(<ScheduleView date="2026-06-13" initialMatches={[]} />);
    // DatePager shows "Today" when the prop matches the current date, otherwise "Sat, Jun 13"
    const label = screen.getByText(/Jun 13|Today/);
    expect(label).toBeDefined();
  });

  it('prev button navigates to the day before', () => {
    render(<ScheduleView date="2026-06-14" initialMatches={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-13');
  });

  it('next button navigates to the day after', () => {
    render(<ScheduleView date="2026-06-14" initialMatches={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-15');
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

describe('ScheduleView — empty matches', () => {
  it('shows EmptyState when no matches', () => {
    render(<ScheduleView date="2026-06-13" initialMatches={[]} />);
    expect(screen.getByText('No matches today')).toBeDefined();
  });
});

// ─── MatchList grouping ───────────────────────────────────────────────────────

describe('ScheduleView → MatchList grouping', () => {
  it('groups group-stage matches under "Group A" header', () => {
    const match = makeMatch({ group: 'A', stage: 'GROUP_STAGE' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByText('Group A')).toBeDefined();
  });

  it('groups knockout matches under stage label header', () => {
    const match = makeMatch({ group: null, stage: 'ROUND_OF_32' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByText('Round of 32')).toBeDefined();
  });

  it('creates separate section headers for Group A and Group B', () => {
    const matchA = makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE' });
    const matchB = makeMatch({
      id: 2,
      group: 'B',
      stage: 'GROUP_STAGE',
      homeTeam: { id: 800, name: 'Brazil', tla: 'BRA', crest: null },
      awayTeam: { id: 801, name: 'France', tla: 'FRA', crest: null },
    });
    render(<ScheduleView date="2026-06-13" initialMatches={[matchA, matchB]} />);
    expect(screen.getByText('Group A')).toBeDefined();
    expect(screen.getByText('Group B')).toBeDefined();
  });

  it('places all matches from the same group under one header', () => {
    const m1 = makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE' });
    const m2 = makeMatch({ id: 2, group: 'A', stage: 'GROUP_STAGE' });
    render(<ScheduleView date="2026-06-13" initialMatches={[m1, m2]} />);
    const headers = screen.getAllByText('Group A');
    expect(headers).toHaveLength(1);
  });
});

// ─── MatchCard rendering in chain ────────────────────────────────────────────

describe('ScheduleView → MatchCard — team names flow through', () => {
  it('renders home and away team names', () => {
    const match = makeMatch({ group: 'A' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Poland').length).toBeGreaterThan(0);
  });

  it('renders "FT" badge for finished match through the full chain', () => {
    const match = makeFinishedMatch({ group: 'A' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByTestId('match-status-badge')).toBeDefined();
    expect(screen.getByTestId('match-status-badge').textContent).toBe('FT');
  });

  it('renders "PP" badge for postponed match', () => {
    const match = makeMatch({ group: 'A', status: 'POSTPONED', isLive: false });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByTestId('match-status-badge').textContent).toBe('PP');
  });

  it('renders venue metadata through the schedule match chain', () => {
    const match = makeMatch({ group: 'A', venue: 'BC Place' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByTestId('match-venue').textContent).toBe('BC Place');
  });
});

// ─── LiveDot flows through chain ─────────────────────────────────────────────

describe('ScheduleView → MatchCard → LiveDot chain', () => {
  it('shows LiveDot for a live match', () => {
    const match = makeLiveMatch({ group: 'A' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByTestId('live-dot')).toBeDefined();
  });

  it('shows "LIVE" badge for live match', () => {
    const match = makeLiveMatch({ group: 'A' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.getByTestId('match-status-badge').textContent).toBe('LIVE');
  });

  it('does NOT show LiveDot for a finished match', () => {
    const match = makeFinishedMatch({ group: 'A' });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('does NOT show LiveDot for a TIMED match', () => {
    const match = makeMatch({ group: 'A', status: 'TIMED', isLive: false });
    render(<ScheduleView date="2026-06-13" initialMatches={[match]} />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });
});

// ─── Polling integration ─────────────────────────────────────────────────────

describe('ScheduleView — live polling updates MatchList', () => {
  it('updates displayed matches after fetch resolves with new data', async () => {
    const liveMatch = makeLiveMatch({ id: 1, group: 'A' });
    const finishedMatch = makeFinishedMatch({ id: 1, group: 'A' });

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ matches: [finishedMatch] }), { status: 200 }),
    );

    render(<ScheduleView date="2026-06-13" initialMatches={[liveMatch]} />);

    // Initially shows LiveDot
    expect(screen.getByTestId('live-dot')).toBeDefined();

    // Flush the immediate runFetch() call that fires when isLive=true
    await act(async () => {});

    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('does NOT poll when no live matches', () => {
    const timedMatch = makeMatch({ group: 'A', status: 'TIMED', isLive: false });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<ScheduleView date="2026-06-13" initialMatches={[timedMatch]} />);

    vi.advanceTimersByTime(120_000);
    expect(mockFetch).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

// ─── Date navigation — matches update when date prop changes ──────────────────

describe('ScheduleView — date navigation updates match list', () => {
  it('shows new matches when date prop changes (DatePager navigation)', () => {
    const jun12Match = makeFinishedMatch({
      id: 1,
      group: 'A',
      homeTeam: { id: 800, name: 'Canada', tla: 'CAN', crest: null },
      awayTeam: { id: 801, name: 'Bosnia', tla: 'BIH', crest: null },
    });
    const jun13Match = makeMatch({
      id: 2,
      group: 'B',
      homeTeam: { id: 802, name: 'United States', tla: 'USA', crest: null },
      awayTeam: { id: 803, name: 'Paraguay', tla: 'PAR', crest: null },
    });

    const { rerender } = render(
      <ScheduleView date="2026-06-12" initialMatches={[jun12Match]} />,
    );

    expect(screen.getAllByText('Canada').length).toBeGreaterThan(0);
    expect(screen.queryByText('United States')).toBeNull();

    // Simulate Next.js re-rendering with new server props after navigation
    rerender(<ScheduleView date="2026-06-13" initialMatches={[jun13Match]} />);

    expect(screen.getAllByText('United States').length).toBeGreaterThan(0);
    expect(screen.queryByText('Canada')).toBeNull();
  });

  it('shows EmptyState when navigating to a date with no matches', () => {
    const match = makeFinishedMatch({ id: 1, group: 'A' });
    const { rerender } = render(
      <ScheduleView date="2026-06-12" initialMatches={[match]} />,
    );
    expect(screen.queryByText('No matches today')).toBeNull();

    rerender(<ScheduleView date="2026-06-20" initialMatches={[]} />);
    expect(screen.getByText('No matches today')).toBeDefined();
  });

  it('clears stale matches before showing new date matches', () => {
    const oldMatch = makeFinishedMatch({
      id: 1,
      group: 'A',
      homeTeam: { id: 800, name: 'OldTeamHome', tla: 'OTH', crest: null },
      awayTeam: { id: 801, name: 'OldTeamAway', tla: 'OTA', crest: null },
    });
    const newMatch = makeMatch({
      id: 2,
      group: 'C',
      homeTeam: { id: 802, name: 'NewTeamHome', tla: 'NTH', crest: null },
      awayTeam: { id: 803, name: 'NewTeamAway', tla: 'NTA', crest: null },
    });

    const { rerender } = render(
      <ScheduleView date="2026-06-12" initialMatches={[oldMatch]} />,
    );
    expect(screen.getAllByText('OldTeamHome').length).toBeGreaterThan(0);

    rerender(<ScheduleView date="2026-06-13" initialMatches={[newMatch]} />);

    expect(screen.queryByText('OldTeamHome')).toBeNull();
    expect(screen.getAllByText('NewTeamHome').length).toBeGreaterThan(0);
  });
});
