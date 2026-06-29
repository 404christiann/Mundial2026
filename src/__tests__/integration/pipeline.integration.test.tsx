/**
 * Integration: Raw API data → normalize → lib functions → render
 *
 * Tests the full pipeline from raw football-data.org shapes all the way to
 * rendered output, exercising the normalization boundary (football.ts →
 * domain.ts) and every lib transformation in between.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { normalizeMatch } from '@/lib/football/endpoints';
import { buildBracket } from '@/lib/bracket';
import { buildGroups } from '@/lib/standings';
import { detectStage } from '@/lib/stage';
import { MatchCard } from '@/components/match/MatchCard';
import { GroupsView } from '@/components/groups/GroupsView';
import { BracketView } from '@/components/bracket/BracketView';
import {
  makeRawMatch,
  makeRawTeam,
  makeRawStanding,
  makeRawStandingRow,
} from '../fixtures';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/groups',
}));

// ─── normalizeMatch status → MatchCard render ─────────────────────────────────

describe('Pipeline: normalizeMatch → MatchCard', () => {
  it('raw PAUSED → IN_PLAY → isLive true → LiveDot visible', () => {
    const raw = makeRawMatch({ status: 'PAUSED' });
    const match = normalizeMatch(raw);
    expect(match.isLive).toBe(true);
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('live-dot')).toBeDefined();
    expect(screen.getByTestId('match-status-badge').textContent).toBe('LIVE');
  });

  it('raw CANCELLED → POSTPONED → "PP" badge', () => {
    const raw = makeRawMatch({ status: 'CANCELLED' });
    const match = normalizeMatch(raw);
    expect(match.status).toBe('POSTPONED');
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-status-badge').textContent).toBe('PP');
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('raw SUSPENDED → POSTPONED → "PP" badge', () => {
    const raw = makeRawMatch({ status: 'SUSPENDED' });
    const match = normalizeMatch(raw);
    expect(match.status).toBe('POSTPONED');
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-status-badge').textContent).toBe('PP');
  });

  it('raw IN_PLAY → IN_PLAY → LiveDot visible', () => {
    const raw = makeRawMatch({ status: 'IN_PLAY' });
    const match = normalizeMatch(raw);
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('live-dot')).toBeDefined();
  });

  it('raw FINISHED + HOME_TEAM winner → match.winner === "HOME" → home team bold', () => {
    const raw = makeRawMatch({
      status: 'FINISHED',
      score: {
        winner: 'HOME_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 2, away: 0 },
        halfTime: { home: 1, away: 0 },
      },
    });
    const match = normalizeMatch(raw);
    expect(match.winner).toBe('HOME');
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-status-badge').textContent).toBe('FT');
  });

  it('raw AWAY_TEAM winner → match.winner === "AWAY"', () => {
    const raw = makeRawMatch({
      status: 'FINISHED',
      score: {
        winner: 'AWAY_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 0, away: 1 },
        halfTime: { home: 0, away: 0 },
      },
    });
    const match = normalizeMatch(raw);
    expect(match.winner).toBe('AWAY');
  });

  it('raw DRAW winner → match.winner === "DRAW"', () => {
    const raw = makeRawMatch({
      status: 'FINISHED',
      score: {
        winner: 'DRAW',
        duration: 'REGULAR',
        fullTime: { home: 1, away: 1 },
        halfTime: { home: 0, away: 0 },
      },
    });
    const match = normalizeMatch(raw);
    expect(match.winner).toBe('DRAW');
  });

  it('raw null team name → "TBD" in normalized match', () => {
    const raw = makeRawMatch({
      homeTeam: makeRawTeam({ name: null as unknown as string }),
    });
    const match = normalizeMatch(raw);
    expect(match.homeTeam.name).toBe('TBD');
  });

  it('raw GROUP_A → group "A" in normalized match', () => {
    const raw = makeRawMatch({ group: 'GROUP_A' });
    const match = normalizeMatch(raw);
    expect(match.group).toBe('A');
  });

  it('raw null group → group null in normalized match', () => {
    const raw = makeRawMatch({ group: null, stage: 'ROUND_OF_32' });
    const match = normalizeMatch(raw);
    expect(match.group).toBeNull();
  });
});

// ─── buildGroups pipeline ─────────────────────────────────────────────────────

describe('Pipeline: raw standings → buildGroups → GroupsView', () => {
  it('team names from raw standings appear in rendered GroupsView', () => {
    const standings = [makeRawStanding()];
    const groups = buildGroups(standings, []);
    render(<GroupsView groups={groups} />);
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Poland').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Saudi Arabia').length).toBeGreaterThan(0);
  });

  it('HOME/AWAY standings are ignored — only TOTAL flows to GroupsView', () => {
    const total = makeRawStanding({ type: 'TOTAL', group: 'GROUP_A' });
    const home = makeRawStanding({
      type: 'HOME',
      group: 'GROUP_A',
      // HOME standing with different team to detect contamination
      table: [makeRawStandingRow({ team: makeRawTeam({ id: 999, name: 'ShouldNotAppear' }) })],
    });
    const away = makeRawStanding({
      type: 'AWAY',
      group: 'GROUP_A',
      table: [makeRawStandingRow({ team: makeRawTeam({ id: 998, name: 'AlsoShouldNotAppear' }) })],
    });
    const groups = buildGroups([total, home, away], []);
    render(<GroupsView groups={groups} />);
    expect(screen.queryByText('ShouldNotAppear')).toBeNull();
    expect(screen.queryByText('AlsoShouldNotAppear')).toBeNull();
    expect(screen.getAllByText('Mexico').length).toBeGreaterThan(0);
  });

  it('group label "Group A" appears in rendered output', () => {
    const groups = buildGroups([makeRawStanding()], []);
    render(<GroupsView groups={groups} />);
    expect(screen.getByText('Group A')).toBeDefined();
  });

  it('top 2 teams are marked qualifying after buildGroups sorts by points', () => {
    // Mexico: 3pts, Poland: 1pt (qualifying); Saudi Arabia 0, South Korea 0
    const groups = buildGroups([makeRawStanding()], []);
    render(<GroupsView groups={groups} />);
    const qualifyingRows = document.querySelectorAll('[data-qualifying="qualifying"]');
    expect(qualifyingRows).toHaveLength(2);
    const texts = [...qualifyingRows].map(r => r.textContent ?? '');
    expect(texts.some(t => t.includes('Mexico'))).toBe(true);
    expect(texts.some(t => t.includes('Poland'))).toBe(true);
  });

  it('normalized match for the group appears in the GroupsView details modal', () => {
    const raw = makeRawMatch({ group: 'GROUP_A', stage: 'GROUP_STAGE' });
    const match = normalizeMatch(raw);
    const groups = buildGroups([makeRawStanding()], [match]);
    render(<GroupsView groups={groups} />);

    fireEvent.click(screen.getByText('Details'));

    expect(screen.getAllByTestId('match-status-badge').length).toBeGreaterThan(0);
  });

  it('empty standings → EmptyState shown in GroupsView', () => {
    const groups = buildGroups([], []);
    render(<GroupsView groups={groups} />);
    expect(screen.getByText('No group data yet')).toBeDefined();
  });
});

// ─── buildBracket pipeline ────────────────────────────────────────────────────

describe('Pipeline: raw knockout matches → buildBracket → BracketView', () => {
  it('normalized ROUND_OF_32 match appears as outer radial crest nodes', () => {
    const raw = makeRawMatch({
      id: 100,
      stage: 'ROUND_OF_32',
      group: null,
      homeTeam: makeRawTeam({ id: 800, name: 'Brazil', tla: 'BRA' }),
      awayTeam: makeRawTeam({ id: 801, name: 'France', tla: 'FRA' }),
    });
    const match = normalizeMatch(raw);
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);

    expect(screen.getAllByTestId('radial-crest')).toHaveLength(2);
    expect(screen.getAllByTestId('radial-tbd')).toHaveLength(30);
  });

  it('GROUP_STAGE matches are excluded from bracket', () => {
    const groupMatch = normalizeMatch(makeRawMatch({ stage: 'GROUP_STAGE', group: 'GROUP_A' }));
    const rounds = buildBracket([groupMatch]);
    render(<BracketView initialRounds={rounds} />);
    expect(screen.getAllByTestId('radial-tbd')).toHaveLength(32);
  });

  it('raw PAUSED knockout normalizes to IN_PLAY without adding live UI to the structural bracket', () => {
    vi.stubGlobal('fetch', vi.fn());
    const raw = makeRawMatch({
      id: 100,
      status: 'PAUSED',
      stage: 'SEMI_FINALS',
      group: null,
      homeTeam: makeRawTeam({ id: 800, name: 'Spain' }),
      awayTeam: makeRawTeam({ id: 801, name: 'England' }),
    });
    const match = normalizeMatch(raw);
    const rounds = buildBracket([match]);
    render(<BracketView initialRounds={rounds} />);
    expect(match.isLive).toBe(true);
    expect(screen.queryByTestId('live-dot')).toBeNull();
    vi.unstubAllGlobals();
  });
});

// ─── detectStage pipeline ─────────────────────────────────────────────────────

describe('Pipeline: raw matches → normalizeMatch → detectStage → stageLabel', () => {
  it('GROUP_STAGE TIMED matches → stageLabel "Group Stage"', () => {
    const raw = makeRawMatch({ stage: 'GROUP_STAGE', matchday: 1, status: 'TIMED' });
    const matches = [normalizeMatch(raw)];
    const ctx = detectStage(matches);
    expect(ctx.stageLabel).toBe('Group Stage');
    expect(ctx.defaultTab).toBe('schedule');
  });

  it('ROUND_OF_16 TIMED matches → stageLabel "Round of 16" and defaultTab "bracket"', () => {
    const raw = makeRawMatch({
      id: 200,
      stage: 'ROUND_OF_16',
      group: null,
      matchday: null,
      status: 'TIMED',
    });
    const matches = [normalizeMatch(raw)];
    const ctx = detectStage(matches);
    expect(ctx.stageLabel).toBe('Round of 16');
    expect(ctx.defaultTab).toBe('bracket');
  });

  it('all FINISHED → returns last stage present, defaultTab "bracket" for FINAL', () => {
    const raws = [
      makeRawMatch({ id: 1, stage: 'GROUP_STAGE', status: 'FINISHED', group: 'GROUP_A' }),
      makeRawMatch({ id: 2, stage: 'FINAL', group: null, matchday: null, status: 'FINISHED' }),
    ];
    const matches = raws.map(normalizeMatch);
    const ctx = detectStage(matches);
    expect(ctx.defaultTab).toBe('bracket');
    expect(ctx.stageLabel).toBe('Final');
  });

  it('empty matches → GROUP_STAGE fallback', () => {
    const ctx = detectStage([]);
    expect(ctx.stageLabel).toBe('Group Stage');
    expect(ctx.defaultTab).toBe('schedule');
  });
});
