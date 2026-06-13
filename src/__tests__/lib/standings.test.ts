import { describe, it, expect } from 'vitest';
import { buildGroups, sortStanding, markQualifiers, matchesForGroup } from '@/lib/standings';
import { makeMatch, makeFinishedMatch, makeStanding, makeRawStanding, makeRawTeam, ALL_GROUP_IDS } from '../fixtures';
import type { Standing } from '@/types/domain';

describe('sortStanding', () => {
  it('sorts by points descending', () => {
    const rows: Standing[] = [
      makeStanding({ position: 3, team: { id: 3, name: 'C', tla: 'CCC', crest: null }, points: 1, goalDifference: 0, goalsFor: 1 }),
      makeStanding({ position: 1, team: { id: 1, name: 'A', tla: 'AAA', crest: null }, points: 7, goalDifference: 5, goalsFor: 7 }),
      makeStanding({ position: 2, team: { id: 2, name: 'B', tla: 'BBB', crest: null }, points: 4, goalDifference: 2, goalsFor: 4 }),
    ];
    const sorted = sortStanding(rows);
    expect(sorted[0].points).toBe(7);
    expect(sorted[1].points).toBe(4);
    expect(sorted[2].points).toBe(1);
  });

  it('breaks points tie by goalDifference descending', () => {
    const rows: Standing[] = [
      makeStanding({ team: { id: 1, name: 'A', tla: 'AAA', crest: null }, points: 4, goalDifference: 0, goalsFor: 2 }),
      makeStanding({ team: { id: 2, name: 'B', tla: 'BBB', crest: null }, points: 4, goalDifference: 3, goalsFor: 4 }),
    ];
    const sorted = sortStanding(rows);
    expect(sorted[0].team.id).toBe(2);
    expect(sorted[1].team.id).toBe(1);
  });

  it('breaks points + GD tie by goalsFor descending', () => {
    const rows: Standing[] = [
      makeStanding({ team: { id: 1, name: 'A', tla: 'AAA', crest: null }, points: 4, goalDifference: 2, goalsFor: 2 }),
      makeStanding({ team: { id: 2, name: 'B', tla: 'BBB', crest: null }, points: 4, goalDifference: 2, goalsFor: 5 }),
    ];
    const sorted = sortStanding(rows);
    expect(sorted[0].team.id).toBe(2);
  });

  it('breaks points + GD + GF tie by team name ascending', () => {
    const rows: Standing[] = [
      makeStanding({ team: { id: 1, name: 'Zimbabwe', tla: 'ZIM', crest: null }, points: 3, goalDifference: 0, goalsFor: 1 }),
      makeStanding({ team: { id: 2, name: 'Argentina', tla: 'ARG', crest: null }, points: 3, goalDifference: 0, goalsFor: 1 }),
    ];
    const sorted = sortStanding(rows);
    expect(sorted[0].team.name).toBe('Argentina');
    expect(sorted[1].team.name).toBe('Zimbabwe');
  });

  it('returns a new array and does not mutate input', () => {
    const rows = [
      makeStanding({ team: { id: 2, name: 'B', tla: 'BBB', crest: null }, points: 1 }),
      makeStanding({ team: { id: 1, name: 'A', tla: 'AAA', crest: null }, points: 3 }),
    ];
    const original = [...rows];
    sortStanding(rows);
    expect(rows[0].team.id).toBe(original[0].team.id);
  });
});

describe('markQualifiers', () => {
  it('marks positions 1 and 2 as qualifying', () => {
    const rows = [
      makeStanding({ position: 1 }),
      makeStanding({ position: 2 }),
      makeStanding({ position: 3 }),
      makeStanding({ position: 4 }),
    ];
    const marked = markQualifiers(rows);
    expect(marked[0].qualifying).toBe(true);
    expect(marked[1].qualifying).toBe(true);
    expect(marked[2].qualifying).toBe(false);
    expect(marked[3].qualifying).toBe(false);
  });

  it('marks only top 2 even with 3 teams in a group (edge case)', () => {
    const rows = [
      makeStanding({ position: 1 }),
      makeStanding({ position: 2 }),
      makeStanding({ position: 3 }),
    ];
    const marked = markQualifiers(rows);
    expect(marked.filter(r => r.qualifying)).toHaveLength(2);
  });

  it('handles a single-team group without throwing', () => {
    const rows = [makeStanding({ position: 1 })];
    const marked = markQualifiers(rows);
    expect(marked[0].qualifying).toBe(true);
  });

  it('returns a new array and does not mutate input', () => {
    const rows = [makeStanding({ position: 1, qualifying: false })];
    const marked = markQualifiers(rows);
    expect(marked).not.toBe(rows);
    expect(rows[0].qualifying).toBe(false);
  });
});

describe('matchesForGroup', () => {
  it('returns only matches for the specified group', () => {
    const matches = [
      makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE' }),
      makeMatch({ id: 2, group: 'B', stage: 'GROUP_STAGE' }),
      makeMatch({ id: 3, group: 'A', stage: 'GROUP_STAGE' }),
    ];
    const result = matchesForGroup(matches, 'A');
    expect(result.map(m => m.id)).toEqual(expect.arrayContaining([1, 3]));
    expect(result.map(m => m.id)).not.toContain(2);
  });

  it('excludes knockout matches even if group is somehow set', () => {
    const matches = [
      makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE' }),
      makeMatch({ id: 2, group: null, stage: 'ROUND_OF_32' }),
    ];
    const result = matchesForGroup(matches, 'A');
    expect(result.map(m => m.id)).not.toContain(2);
  });

  it('returns matches sorted by matchday then utcDate', () => {
    const matches = [
      makeMatch({ id: 3, group: 'A', stage: 'GROUP_STAGE', matchday: 2, utcDate: '2026-06-25T18:00:00Z' }),
      makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE', matchday: 1, utcDate: '2026-06-13T18:00:00Z' }),
      makeMatch({ id: 2, group: 'A', stage: 'GROUP_STAGE', matchday: 1, utcDate: '2026-06-14T18:00:00Z' }),
    ];
    const result = matchesForGroup(matches, 'A');
    expect(result.map(m => m.id)).toEqual([1, 2, 3]);
  });

  it('returns empty array when no matches for group', () => {
    const matches = [makeMatch({ group: 'B', stage: 'GROUP_STAGE' })];
    expect(matchesForGroup(matches, 'A')).toEqual([]);
  });
});

describe('buildGroups', () => {
  it('returns 12 groups ordered A through L', () => {
    const standings = ALL_GROUP_IDS.map(id =>
      makeRawStanding({ group: `GROUP_${id}` })
    );
    const groups = buildGroups(standings, []);
    expect(groups).toHaveLength(12);
    expect(groups.map(g => g.id)).toEqual([...ALL_GROUP_IDS]);
  });

  it('attaches correct group matches to each group', () => {
    const standingsA = makeRawStanding({ group: 'GROUP_A' });
    const standingsB = makeRawStanding({ group: 'GROUP_B' });
    const matchA = makeMatch({ id: 1, group: 'A', stage: 'GROUP_STAGE' });
    const matchB = makeMatch({ id: 2, group: 'B', stage: 'GROUP_STAGE' });

    const groups = buildGroups([standingsA, standingsB], [matchA, matchB]);
    const groupA = groups.find(g => g.id === 'A')!;
    const groupB = groups.find(g => g.id === 'B')!;

    expect(groupA.matches.map(m => m.id)).toContain(1);
    expect(groupA.matches.map(m => m.id)).not.toContain(2);
    expect(groupB.matches.map(m => m.id)).toContain(2);
  });

  it('each group has a label like "Group A"', () => {
    const standings = [makeRawStanding({ group: 'GROUP_A' })];
    const groups = buildGroups(standings, []);
    expect(groups[0].label).toBe('Group A');
  });

  it('standings within each group are sorted by the sort rules', () => {
    const standing = makeRawStanding({
      group: 'GROUP_A',
      table: [
        { position: 2, team: makeRawTeam({ id: 2, name: 'B', tla: 'BBB' }), playedGames: 1, won: 0, draw: 1, lost: 0, points: 1, goalsFor: 1, goalsAgainst: 1, goalDifference: 0 },
        { position: 1, team: makeRawTeam({ id: 1, name: 'A', tla: 'AAA' }), playedGames: 1, won: 1, draw: 0, lost: 0, points: 3, goalsFor: 2, goalsAgainst: 0, goalDifference: 2 },
      ],
    });
    const groups = buildGroups([standing], []);
    expect(groups[0].standings[0].points).toBeGreaterThan(groups[0].standings[1].points);
  });

  it('top 2 in each group are marked as qualifying', () => {
    const standing = makeRawStanding({ group: 'GROUP_A' });
    const groups = buildGroups([standing], []);
    const groupA = groups.find(g => g.id === 'A')!;
    expect(groupA.standings[0].qualifying).toBe(true);
    expect(groupA.standings[1].qualifying).toBe(true);
    expect(groupA.standings[2].qualifying).toBe(false);
    expect(groupA.standings[3].qualifying).toBe(false);
  });

  it('handles groups with no matches gracefully', () => {
    const standings = [makeRawStanding({ group: 'GROUP_A' })];
    const groups = buildGroups(standings, []);
    expect(groups[0].matches).toEqual([]);
  });
});
