/**
 * Integration: GroupCard → StandingsTable
 * Integration: GroupsView → GroupCard[] + BottomSheet
 *
 * Tests that the collapsed group card stays focused on standings while the
 * details modal carries the deeper match content.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupsView } from '@/components/groups/GroupsView';
import { makeGroup, makeMatch, makeLiveMatch, makeFinishedMatch, makeStanding, makeTeam } from '../fixtures';
import type { Group } from '@/types/domain';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/groups',
}));

describe('GroupCard — group label', () => {
  it('renders the group label in the card header', () => {
    render(<GroupCard group={makeGroup()} />);
    expect(screen.getByText('Group A')).toBeDefined();
  });

  it('renders the group label for a different group', () => {
    const group: Group = { ...makeGroup(), id: 'G', label: 'Group G' };
    render(<GroupCard group={group} />);
    expect(screen.getByText('Group G')).toBeDefined();
  });
});

describe('GroupCard → StandingsTable — standings data flows through', () => {
  it('renders all four team names from standings', () => {
    render(<GroupCard group={makeGroup()} />);
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Poland').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Saudi Arabia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('South Korea').length).toBeGreaterThan(0);
  });

  it('renders table column headers P, GD, Pts', () => {
    render(<GroupCard group={makeGroup()} />);
    expect(screen.getByText('P')).toBeDefined();
    expect(screen.getByText('GD')).toBeDefined();
    expect(screen.getByText('Pts')).toBeDefined();
  });
});

describe('GroupCard → StandingsTable — qualifying indicator', () => {
  it('marks the top 2 teams with data-qualifying="qualifying"', () => {
    render(<GroupCard group={makeGroup()} />);
    const qualifyingRows = document.querySelectorAll('[data-qualifying="qualifying"]');
    expect(qualifyingRows).toHaveLength(2);
  });

  it('qualifying rows contain the top 2 team names', () => {
    render(<GroupCard group={makeGroup()} />);
    const qualifyingRows = document.querySelectorAll('[data-qualifying="qualifying"]');
    const rowTexts = [...qualifyingRows].map(r => r.textContent ?? '');
    expect(rowTexts.some(t => t.includes('Mexico'))).toBe(true);
    expect(rowTexts.some(t => t.includes('Poland'))).toBe(true);
  });

  it('does NOT mark bottom 2 teams as qualifying', () => {
    render(<GroupCard group={makeGroup()} />);
    const allRows = document.querySelectorAll('tbody tr');
    const nonQualifyingRows = [...allRows].filter(
      r => r.getAttribute('data-qualifying') !== 'qualifying',
    );
    const rowTexts = nonQualifyingRows.map(r => r.textContent ?? '');
    expect(rowTexts.some(t => t.includes('Saudi Arabia'))).toBe(true);
    expect(rowTexts.some(t => t.includes('South Korea'))).toBe(true);
  });
});

describe('GroupCard — collapsed card stays table-only', () => {
  it('does not render match team names inside the collapsed group card', () => {
    const group = makeGroup({
      matches: [
        makeMatch({
          id: 10,
          homeTeam: makeTeam({ name: 'Argentina' }),
          awayTeam: makeTeam({ id: 802, name: 'Portugal' }),
        }),
      ],
    });
    render(<GroupCard group={group} />);
    expect(screen.queryByText('Argentina')).toBeNull();
    expect(screen.queryByText('Portugal')).toBeNull();
  });

  it('does not render match status elements inside the collapsed group card', () => {
    const group = makeGroup({
      matches: [makeLiveMatch({ id: 10 })],
    });
    render(<GroupCard group={group} />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
    expect(screen.queryByTestId('match-status-badge')).toBeNull();
  });

  it('does not render match venue inside the collapsed group card', () => {
    const group = makeGroup({
      matches: [makeMatch({ id: 10, venue: 'MetLife Stadium' })],
    });
    render(<GroupCard group={group} />);
    expect(screen.queryByText('MetLife Stadium')).toBeNull();
    expect(screen.queryByTestId('match-venue')).toBeNull();
  });
});

describe('GroupsView → GroupCard[] — multiple groups', () => {
  it('renders a card for each group', () => {
    const groupA = makeGroup({ id: 'A', label: 'Group A' });
    const groupB: Group = { ...makeGroup(), id: 'B', label: 'Group B' };
    render(<GroupsView groups={[groupA, groupB]} />);
    expect(screen.getByText('Group A')).toBeDefined();
    expect(screen.getByText('Group B')).toBeDefined();
  });

  it('shows EmptyState when no groups provided', () => {
    render(<GroupsView groups={[]} />);
    expect(screen.getByText('No group data yet')).toBeDefined();
  });

  it('renders correct number of qualifying rows across multiple groups', () => {
    const groupA = makeGroup({ id: 'A', label: 'Group A' });
    const groupB: Group = {
      ...makeGroup(),
      id: 'B',
      label: 'Group B',
      standings: [
        makeStanding({ position: 1, team: makeTeam({ id: 800, name: 'Brazil' }), qualifying: true }),
        makeStanding({ position: 2, team: makeTeam({ id: 801, name: 'France' }), qualifying: true }),
        makeStanding({ position: 3, team: makeTeam({ id: 802, name: 'Germany' }), qualifying: false }),
        makeStanding({ position: 4, team: makeTeam({ id: 803, name: 'Italy' }), qualifying: false }),
      ],
      matches: [],
    };
    render(<GroupsView groups={[groupA, groupB]} />);
    const qualifyingRows = document.querySelectorAll('[data-qualifying="qualifying"]');
    expect(qualifyingRows).toHaveLength(4);
  });

  it('shows all teams from both groups', () => {
    const groupA = makeGroup({ id: 'A', label: 'Group A', matches: [] });
    const groupB: Group = {
      ...makeGroup(),
      id: 'B',
      label: 'Group B',
      standings: [
        makeStanding({ position: 1, team: makeTeam({ id: 800, name: 'Brazil' }), qualifying: true }),
        makeStanding({ position: 2, team: makeTeam({ id: 801, name: 'France' }), qualifying: true }),
        makeStanding({ position: 3, team: makeTeam({ id: 802, name: 'Germany' }), qualifying: false }),
        makeStanding({ position: 4, team: makeTeam({ id: 803, name: 'Italy' }), qualifying: false }),
      ],
      matches: [],
    };
    render(<GroupsView groups={[groupA, groupB]} />);
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Brazil').length).toBeGreaterThan(0);
  });

  it('opens the bottom sheet with match details when Details is clicked', () => {
    const group = makeGroup({
      matches: [
        makeFinishedMatch({
          id: 10,
          homeTeam: makeTeam({ name: 'Argentina' }),
          awayTeam: makeTeam({ id: 802, name: 'Portugal' }),
        }),
      ],
    });
    render(<GroupsView groups={[group]} />);

    fireEvent.click(screen.getByText('Details'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Argentina')).toBeDefined();
    expect(screen.getByText('Portugal')).toBeDefined();
    expect(screen.getByTestId('match-status-badge').textContent).toBe('FT');
  });

  it('shows match dates inside the bottom sheet match cards', () => {
    const group = makeGroup({
      matches: [
        makeMatch({
          id: 10,
          utcDate: '2026-06-13T18:00:00Z',
          homeTeam: makeTeam({ name: 'Argentina' }),
          awayTeam: makeTeam({ id: 802, name: 'Algeria' }),
        }),
      ],
    });
    render(<GroupsView groups={[group]} />);

    fireEvent.click(screen.getByText('Details'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Jun 13/)).toBeDefined();
  });

  it('shows match venue inside the bottom sheet match cards', () => {
    const group = makeGroup({
      matches: [
        makeMatch({
          id: 10,
          venue: 'Mercedes-Benz Stadium',
          homeTeam: makeTeam({ name: 'Argentina' }),
          awayTeam: makeTeam({ id: 802, name: 'Algeria' }),
        }),
      ],
    });
    render(<GroupsView groups={[group]} />);

    fireEvent.click(screen.getByText('Details'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByTestId('match-venue').textContent).toBe('Mercedes-Benz Stadium');
  });

  it('shows live match indicators inside the bottom sheet', () => {
    const group = makeGroup({ matches: [makeLiveMatch({ id: 10 })] });
    render(<GroupsView groups={[group]} />);

    fireEvent.click(screen.getByText('Details'));

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByTestId('live-dot')).toBeDefined();
    expect(screen.getByTestId('match-status-badge').textContent).toBe('LIVE');
  });
});
