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

  it('still shows all 6 round headers and 12 TBDs when all empty', () => {
    const rounds = buildBracket([]);
    render(<BracketView initialRounds={rounds} />);

    expect(screen.getByText('Round of 32')).toBeDefined();
    expect(screen.getByText('Round of 16')).toBeDefined();
    expect(screen.getByText('Quarter Finals')).toBeDefined();
    expect(screen.getByText('Semi Finals')).toBeDefined();
    expect(screen.getByText('Third Place')).toBeDefined();
    expect(screen.getByText('Final')).toBeDefined();

    const tbdEls = screen.getAllByText('TBD');
    expect(tbdEls.length).toBe(12);
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
