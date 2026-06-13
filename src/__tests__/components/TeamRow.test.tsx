import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamRow } from '@/components/match/TeamRow';
import { makeTeam } from '../fixtures';

describe('TeamRow', () => {
  it('renders team name', () => {
    render(<TeamRow team={makeTeam({ name: 'Brazil' })} score={null} />);
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('renders "TBD" when team name is TBD', () => {
    render(<TeamRow team={{ id: null, name: 'TBD', tla: '', crest: null }} score={null} />);
    expect(screen.getByText('TBD')).toBeInTheDocument();
  });

  it('renders score when provided', () => {
    render(<TeamRow team={makeTeam()} score={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not render a numeric score when score is null', () => {
    render(<TeamRow team={makeTeam()} score={null} />);
    expect(screen.queryByText('null')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders score of 0 correctly', () => {
    render(<TeamRow team={makeTeam()} score={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies winner styling when isWinner is true', () => {
    const { container } = render(<TeamRow team={makeTeam({ name: 'Spain' })} score={1} isWinner />);
    const nameEl = screen.getByText('Spain');
    expect(nameEl.className || container.innerHTML).toMatch(/font-bold|font-semibold|winner/);
  });

  it('renders a team flag image when crest is provided', () => {
    const { container } = render(
      <TeamRow team={makeTeam({ crest: 'https://crests.football-data.org/760.svg' })} score={null} />
    );
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders a fallback when crest is null', () => {
    const { container } = render(
      <TeamRow team={{ id: null, name: 'TBD', tla: '', crest: null }} score={null} />
    );
    // Either an img with a fallback src, or a placeholder element — the flag area must exist
    const flagArea = container.querySelector('[data-testid="team-flag"]');
    expect(flagArea).toBeInTheDocument();
  });
});
