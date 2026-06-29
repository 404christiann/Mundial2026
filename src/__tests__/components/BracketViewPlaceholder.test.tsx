import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketView } from '@/components/bracket/BracketView';
import { buildBracket } from '@/lib/bracket';
import { makeMatch } from '../fixtures';

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

describe('BracketView — placeholder message', () => {
  it('shows placeholder text when all rounds are empty (buildBracket([]))', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);

    expect(screen.getByText('Bracket fills in after the group stage')).toBeDefined();
  });

  it('still renders all radial ring labels and 32 TBD outer slots when all empty', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);

    expect(screen.getByText('R32')).toBeDefined();
    expect(screen.getByText('R16')).toBeDefined();
    expect(screen.getByText('QF')).toBeDefined();
    expect(screen.getByText('SF')).toBeDefined();
    expect(screen.getByText('Final')).toBeDefined();

    expect(screen.getAllByText('?')).toHaveLength(32);
  });

  it('does NOT show placeholder when at least 1 knockout match exists', () => {
    const knockoutMatch = makeMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      homeTeam: { id: 800, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 801, name: 'Portugal', tla: 'POR', crest: null },
    });
    const rounds = buildBracket([knockoutMatch]);
    render(<BracketView initialRounds={rounds} />);

    expect(screen.queryByText('Bracket fills in after the group stage')).toBeNull();
  });
});
