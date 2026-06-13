import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketMatch } from '@/components/bracket/BracketMatch';
import { makeMatch, makeFinishedMatch, makeLiveMatch } from '../fixtures';

describe('BracketMatch', () => {
  it('renders two TBD placeholders when match is null', () => {
    render(<BracketMatch match={null} />);
    const tbdElements = screen.getAllByText('TBD');
    expect(tbdElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders home and away team names when match is provided', () => {
    const match = makeMatch({
      stage: 'ROUND_OF_32',
      matchday: null,
      group: null,
      homeTeam: { id: 1, name: 'Argentina', tla: 'ARG', crest: null },
      awayTeam: { id: 2, name: 'France', tla: 'FRA', crest: null },
    });
    render(<BracketMatch match={match} />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders "TBD" for an unresolved home team in a knockout match', () => {
    const match = makeMatch({
      stage: 'ROUND_OF_16',
      matchday: null,
      group: null,
      homeTeam: { id: null, name: 'TBD', tla: '', crest: null },
    });
    render(<BracketMatch match={match} />);
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });

  it('highlights the winning team when match is finished', () => {
    const match = makeFinishedMatch({
      stage: 'QUARTER_FINALS',
      matchday: null,
      group: null,
      homeTeam: { id: 1, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 2, name: 'Germany', tla: 'GER', crest: null },
      winner: 'HOME',
    });
    render(<BracketMatch match={match} />);
    const spainEl = screen.getByText('Spain');
    expect(spainEl.className || spainEl.closest('[class]')?.className).toMatch(/bold|winner|highlight/i);
  });

  it('does not apply winner styling to the losing team', () => {
    const match = makeFinishedMatch({
      stage: 'QUARTER_FINALS',
      matchday: null,
      group: null,
      homeTeam: { id: 1, name: 'Spain', tla: 'ESP', crest: null },
      awayTeam: { id: 2, name: 'Germany', tla: 'GER', crest: null },
      winner: 'HOME',
    });
    render(<BracketMatch match={match} />);
    const germanyEl = screen.getByText('Germany');
    expect(germanyEl.className || '').not.toMatch(/winner/i);
  });

  it('shows scores for a finished match', () => {
    const match = makeFinishedMatch({
      stage: 'SEMI_FINALS',
      matchday: null,
      group: null,
      fullTime: { home: 2, away: 1 },
    });
    render(<BracketMatch match={match} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders LiveDot for an in-play match', () => {
    const match = makeLiveMatch({
      stage: 'FINAL',
      matchday: null,
      group: null,
    });
    render(<BracketMatch match={match} />);
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
  });

  it('does not render LiveDot for a finished match', () => {
    const match = makeFinishedMatch({ stage: 'FINAL', matchday: null, group: null });
    render(<BracketMatch match={match} />);
    expect(screen.queryByTestId('live-dot')).not.toBeInTheDocument();
  });

  it('does not render LiveDot for a null match (placeholder)', () => {
    render(<BracketMatch match={null} />);
    expect(screen.queryByTestId('live-dot')).not.toBeInTheDocument();
  });

  it('renders without crashing for a DRAW result', () => {
    const match = makeFinishedMatch({
      stage: 'ROUND_OF_32',
      matchday: null,
      group: null,
      fullTime: { home: 1, away: 1 },
      winner: 'DRAW',
    });
    expect(() => render(<BracketMatch match={match} />)).not.toThrow();
  });
});
