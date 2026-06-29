/**
 * Integration: buildBracket -> BracketView -> RadialBracketView
 *
 * Verifies that normalized bracket data flows into the radial renderer while
 * preserving the existing live polling behavior from useBracket.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { BracketView } from '@/components/bracket/BracketView';
import { buildBracket } from '@/lib/bracket';
import { makeFinishedMatch, makeLiveMatch, makeMatch } from '../fixtures';

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

describe('BracketView radial renderer', () => {
  it('renders radial labels and the third-place placeholder from an empty bracket', () => {
    render(<BracketView initialRounds={buildBracket([])} />);

    expect(screen.getByTestId('radial-bracket')).toBeDefined();
    expect(screen.getByText('R32')).toBeDefined();
    expect(screen.getByText('R16')).toBeDefined();
    expect(screen.getByText('QF')).toBeDefined();
    expect(screen.getByText('SF')).toBeDefined();
    expect(screen.getByText('Final')).toBeDefined();
    expect(screen.getByText('Third Place')).toBeDefined();
    expect(screen.getByText('Third place match - TBD')).toBeDefined();
  });

  it('renders 32 outer TBD placeholders when no knockout teams exist', () => {
    render(<BracketView initialRounds={buildBracket([])} />);

    expect(screen.getAllByTestId('radial-tbd')).toHaveLength(32);
  });

  it('renders real R32 crest nodes and keeps missing slots as TBD', () => {
    const r32Match = makeMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      matchday: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'Portugal', tla: 'POR', crest: null },
    });

    render(<BracketView initialRounds={buildBracket([r32Match])} />);

    expect(screen.getAllByTestId('radial-crest')).toHaveLength(2);
    expect(screen.getAllByTestId('radial-tbd')).toHaveLength(30);
    expect(screen.getByText('ARG')).toBeDefined();
    expect(screen.getByText('POR')).toBeDefined();
  });

  it('shows advanced teams on inner rings when the next-round slot is known', () => {
    const canada = { id: 828, name: 'Canada', tla: 'CAN', crest: null };
    const r32Match = makeFinishedMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      matchday: null,
      homeTeam: { id: 774, name: 'South Africa', tla: 'RSA', crest: null },
      awayTeam: canada,
      winner: 'AWAY',
    });
    const r16Match = makeMatch({
      id: 200,
      stage: 'ROUND_OF_16',
      group: null,
      matchday: null,
      homeTeam: canada,
      awayTeam: { id: null, name: 'TBD', tla: '', crest: null },
    });

    render(<BracketView initialRounds={buildBracket([r32Match, r16Match])} />);

    expect(screen.getAllByTestId('radial-participant')).toHaveLength(1);
    expect(screen.getAllByText('CAN')).toHaveLength(2);
  });

  it('shows a themed country tooltip when a nation icon is clicked', async () => {
    const r32Match = makeMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      matchday: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'Portugal', tla: 'POR', crest: null },
    });

    render(<BracketView initialRounds={buildBracket([r32Match])} />);

    fireEvent.click(screen.getByRole('button', { name: 'Argentina' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Argentina');

    fireEvent.click(screen.getByRole('button', { name: 'Argentina' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders the third-place match below the radial canvas when available', () => {
    const thirdPlace = makeMatch({
      id: 200,
      stage: 'THIRD_PLACE',
      group: null,
      matchday: null,
      homeTeam: { id: 800, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 801, name: 'England', tla: 'ENG', crest: null },
    });

    render(<BracketView initialRounds={buildBracket([thirdPlace])} />);

    expect(screen.getByText('Spain')).toBeDefined();
    expect(screen.getByText('England')).toBeDefined();
  });
});

describe('BracketView polling', () => {
  it('polls /api/bracket when a live knockout match exists', async () => {
    const liveMatch = makeLiveMatch({
      id: 100,
      stage: 'QUARTER_FINALS',
      group: null,
      matchday: null,
    });
    const finishedMatch = makeFinishedMatch({
      id: 100,
      stage: 'QUARTER_FINALS',
      group: null,
      matchday: null,
    });
    const updatedRounds = buildBracket([finishedMatch]);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ rounds: updatedRounds }), { status: 200 }),
    );

    render(<BracketView initialRounds={buildBracket([liveMatch])} />);

    await act(async () => {});

    expect(fetch).toHaveBeenCalledWith('/api/bracket');
  });

  it('does not poll when all matches are finished', () => {
    const finished = makeFinishedMatch({
      id: 100,
      stage: 'FINAL',
      group: null,
      matchday: null,
    });
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<BracketView initialRounds={buildBracket([finished])} />);

    vi.advanceTimersByTime(120_000);
    expect(mockFetch).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
