import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchCard } from '@/components/match/MatchCard';
import { makeMatch, makeLiveMatch, makeFinishedMatch } from '../fixtures';

describe('MatchCard', () => {
  it('renders home team name', () => {
    const match = makeMatch({ homeTeam: { id: 1, name: 'Argentina', tla: 'ARG', crest: null } });
    render(<MatchCard match={match} />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('renders away team name', () => {
    const match = makeMatch({ awayTeam: { id: 2, name: 'France', tla: 'FRA', crest: null } });
    render(<MatchCard match={match} />);
    expect(screen.getByText('France')).toBeInTheDocument();
  });

  it('renders LiveDot when match is IN_PLAY', () => {
    const match = makeLiveMatch();
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
  });

  it('does not render LiveDot when match is FINISHED', () => {
    const match = makeFinishedMatch();
    render(<MatchCard match={match} />);
    expect(screen.queryByTestId('live-dot')).not.toBeInTheDocument();
  });

  it('does not render LiveDot when match is TIMED', () => {
    const match = makeMatch({ status: 'TIMED' });
    render(<MatchCard match={match} />);
    expect(screen.queryByTestId('live-dot')).not.toBeInTheDocument();
  });

  it('does not render LiveDot when match is POSTPONED', () => {
    const match = makeMatch({ status: 'POSTPONED' });
    render(<MatchCard match={match} />);
    expect(screen.queryByTestId('live-dot')).not.toBeInTheDocument();
  });

  it('shows scores for a finished match', () => {
    const match = makeFinishedMatch({ fullTime: { home: 3, away: 1 } });
    render(<MatchCard match={match} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not show numeric scores for an unplayed match', () => {
    const match = makeMatch({ status: 'TIMED', fullTime: { home: null, away: null } });
    render(<MatchCard match={match} />);
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('renders "TBD" for unknown teams in knockout rounds', () => {
    const match = makeMatch({
      stage: 'ROUND_OF_32',
      homeTeam: { id: null, name: 'TBD', tla: '', crest: null },
    });
    render(<MatchCard match={match} />);
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });

  it('renders a MatchStatusBadge', () => {
    const match = makeFinishedMatch();
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-status-badge')).toBeInTheDocument();
  });

  it('shows "FT" badge for finished matches', () => {
    const match = makeFinishedMatch();
    render(<MatchCard match={match} />);
    expect(screen.getByText('FT')).toBeInTheDocument();
  });

  it('shows "LIVE" badge for in-play matches', () => {
    const match = makeLiveMatch();
    render(<MatchCard match={match} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('shows "PP" badge for postponed matches', () => {
    const match = makeMatch({ status: 'POSTPONED' });
    render(<MatchCard match={match} />);
    expect(screen.getByText('PP')).toBeInTheDocument();
  });

  it('shows kickoff date when requested', () => {
    const match = makeMatch({ utcDate: '2026-06-13T18:00:00Z' });
    render(<MatchCard match={match} showDate />);
    expect(screen.getByText(/Jun 13/)).toBeInTheDocument();
  });

  it('renders venue metadata when present', () => {
    const match = makeMatch({ venue: 'MetLife Stadium' });
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-venue')).toHaveTextContent('MetLife Stadium');
  });

  it('does not render venue metadata when venue is null', () => {
    const match = makeMatch({ venue: null });
    render(<MatchCard match={match} />);
    expect(screen.queryByTestId('match-venue')).not.toBeInTheDocument();
  });
});
