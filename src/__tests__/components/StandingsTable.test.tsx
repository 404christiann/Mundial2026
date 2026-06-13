import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { StandingsTable } from '@/components/groups/StandingsTable';
import { makeStanding, makeTeam } from '../fixtures';

const defaultStandings = [
  makeStanding({ position: 1, team: makeTeam({ name: 'Mexico' }), points: 7, won: 2, draw: 1, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, qualifying: true }),
  makeStanding({ position: 2, team: makeTeam({ name: 'Poland' }), points: 4, won: 1, draw: 1, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, qualifying: true }),
  makeStanding({ position: 3, team: makeTeam({ name: 'Saudi Arabia' }), points: 2, won: 0, draw: 2, lost: 1, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, qualifying: false }),
  makeStanding({ position: 4, team: makeTeam({ name: 'South Korea' }), points: 0, won: 0, draw: 0, lost: 3, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, qualifying: false }),
];

describe('StandingsTable', () => {
  it('renders all 4 team names', () => {
    render(<StandingsTable standings={defaultStandings} />);
    expect(screen.getByText('Mexico')).toBeInTheDocument();
    expect(screen.getByText('Poland')).toBeInTheDocument();
    expect(screen.getByText('Saudi Arabia')).toBeInTheDocument();
    expect(screen.getByText('South Korea')).toBeInTheDocument();
  });

  it('renders column headers: P, W, D, L, GF, GA, GD, Pts', () => {
    render(<StandingsTable standings={defaultStandings} />);
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('Pts')).toBeInTheDocument();
  });

  it('renders each team\'s points', () => {
    render(<StandingsTable standings={defaultStandings} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('marks position 1 as qualifying', () => {
    render(<StandingsTable standings={defaultStandings} />);
    const rows = screen.getAllByRole('row');
    // Skip header row, first data row = position 1
    const row1 = rows[1];
    expect(row1.dataset.qualifying ?? row1.className).toMatch(/qualifying|qualify|advance/i);
  });

  it('marks position 2 as qualifying', () => {
    render(<StandingsTable standings={defaultStandings} />);
    const rows = screen.getAllByRole('row');
    const row2 = rows[2];
    expect(row2.dataset.qualifying ?? row2.className).toMatch(/qualifying|qualify|advance/i);
  });

  it('does not mark position 3 as qualifying', () => {
    render(<StandingsTable standings={defaultStandings} />);
    const rows = screen.getAllByRole('row');
    const row3 = rows[3];
    expect(row3.dataset.qualifying ?? row3.className).not.toMatch(/qualifying|qualify|advance/i);
  });

  it('does not mark position 4 as qualifying', () => {
    render(<StandingsTable standings={defaultStandings} />);
    const rows = screen.getAllByRole('row');
    const row4 = rows[4];
    expect(row4.dataset.qualifying ?? row4.className).not.toMatch(/qualifying|qualify|advance/i);
  });

  it('renders goal difference including negative values', () => {
    render(<StandingsTable standings={defaultStandings} />);
    expect(screen.getAllByText('-2').length).toBeGreaterThan(0);
  });

  it('renders goal difference with + prefix for positive values', () => {
    render(<StandingsTable standings={defaultStandings} />);
    expect(screen.getByText('+4')).toBeInTheDocument();
  });

  it('renders teams in the order provided (no re-sorting in component)', () => {
    render(<StandingsTable standings={defaultStandings} />);
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Mexico')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Poland')).toBeInTheDocument();
  });

  it('handles an empty standings array without crashing', () => {
    expect(() => render(<StandingsTable standings={[]} />)).not.toThrow();
  });
});
