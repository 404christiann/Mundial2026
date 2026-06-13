/**
 * Unit test gaps — edge cases not covered by the existing test suite.
 * Ordered by likelihood of catching a real bug.
 *
 * HIGH:  bugs that have plausible code paths; missing coverage = real risk
 * MEDIUM: correctness assumptions not validated anywhere
 * LOW:  defensive/boundary cases, unlikely but completeable
 */
import { describe, it, expect } from 'vitest';
import { buildGroups, sortStanding, matchesForGroup } from '@/lib/standings';
import { detectStage } from '@/lib/stage';
import { normalizeMatch, normalizeStatus, parseGroupId } from '@/lib/football/endpoints';
import { buildBracket } from '@/lib/bracket';
import { addDays } from '@/lib/time';
import {
  makeRawMatch,
  makeRawTeam,
  makeRawStanding,
  makeRawStandingRow,
  makeMatch,
  makeFinishedMatch,
  makeStanding,
  makeTeam,
} from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════════
// HIGH — most likely to catch a real bug
// ═══════════════════════════════════════════════════════════════════════════════

describe('GAP-HIGH: buildGroups — HOME/AWAY standings are silently ignored', () => {
  it('ignores a standing with type HOME', () => {
    const home = makeRawStanding({ type: 'HOME', group: 'GROUP_B' });
    const groups = buildGroups([home], []);
    expect(groups).toHaveLength(0);
  });

  it('ignores a standing with type AWAY', () => {
    const away = makeRawStanding({ type: 'AWAY', group: 'GROUP_B' });
    const groups = buildGroups([away], []);
    expect(groups).toHaveLength(0);
  });

  it('processes TOTAL but ignores HOME and AWAY from the same group', () => {
    const total = makeRawStanding({ type: 'TOTAL', group: 'GROUP_C' });
    const home = makeRawStanding({
      type: 'HOME',
      group: 'GROUP_C',
      table: [makeRawStandingRow({ team: makeRawTeam({ id: 999, name: 'Ghost Team' }) })],
    });
    const groups = buildGroups([total, home], []);
    expect(groups).toHaveLength(1);
    const teamNames = groups[0].standings.map(s => s.team.name);
    expect(teamNames).not.toContain('Ghost Team');
    expect(teamNames).toContain('Mexico');
  });

  it('handles a mix of TOTAL standings for two different groups', () => {
    const groupA = makeRawStanding({ type: 'TOTAL', group: 'GROUP_A' });
    const groupB = makeRawStanding({ type: 'TOTAL', group: 'GROUP_B' });
    const homeB = makeRawStanding({ type: 'HOME', group: 'GROUP_B' });
    const groups = buildGroups([groupA, groupB, homeB], []);
    expect(groups).toHaveLength(2);
  });
});

describe('GAP-HIGH: detectStage — group stage label is stage-only', () => {
  it('returns Group Stage when matchdays 1 and 2 are FINISHED and matchday 3 is TIMED', () => {
    const md1 = makeMatch({ id: 1, status: 'FINISHED', matchday: 1, stage: 'GROUP_STAGE', group: 'A' });
    const md2 = makeMatch({ id: 2, status: 'FINISHED', matchday: 2, stage: 'GROUP_STAGE', group: 'A' });
    const md3 = makeMatch({ id: 3, status: 'TIMED',    matchday: 3, stage: 'GROUP_STAGE', group: 'A' });
    const ctx = detectStage([md1, md2, md3]);
    expect(ctx.stageLabel).toBe('Group Stage');
  });

  it('returns Group Stage when matchday 1 is FINISHED and matchday 2 has a live match', () => {
    const md1a = makeMatch({ id: 1, status: 'FINISHED', matchday: 1, stage: 'GROUP_STAGE', group: 'A' });
    const md1b = makeMatch({ id: 2, status: 'FINISHED', matchday: 1, stage: 'GROUP_STAGE', group: 'A' });
    const md2  = makeMatch({ id: 3, status: 'IN_PLAY',  matchday: 2, stage: 'GROUP_STAGE', group: 'A' });
    const ctx = detectStage([md1a, md1b, md2]);
    expect(ctx.stageLabel).toBe('Group Stage');
  });

  it('does not expose matchday text when multiple matchdays have TIMED matches', () => {
    const md1 = makeMatch({ id: 1, status: 'TIMED', matchday: 1, stage: 'GROUP_STAGE', group: 'A' });
    const md2 = makeMatch({ id: 2, status: 'TIMED', matchday: 2, stage: 'GROUP_STAGE', group: 'A' });
    const ctx = detectStage([md1, md2]);
    expect(ctx.stageLabel).toBe('Group Stage');
  });
});

describe('GAP-HIGH: detectStage — POSTPONED matches do not count as incomplete', () => {
  it('skips GROUP_STAGE when all non-POSTPONED matches are FINISHED', () => {
    // Only a POSTPONED match in GROUP_STAGE, one TIMED in ROUND_OF_32
    const groupPostponed = makeMatch({
      id: 1, status: 'POSTPONED', matchday: 1, stage: 'GROUP_STAGE', group: 'A',
    });
    const r32Timed = makeMatch({
      id: 2, status: 'TIMED', matchday: null, stage: 'ROUND_OF_32', group: null,
    });
    const ctx = detectStage([groupPostponed, r32Timed]);
    expect(ctx.currentStage).toBe('ROUND_OF_32');
    expect(ctx.defaultTab).toBe('bracket');
  });
});

describe('GAP-HIGH: normalizeMatch — THIRD_PLACE stage passes through', () => {
  it('preserves THIRD_PLACE stage in normalized match', () => {
    const raw = makeRawMatch({ stage: 'THIRD_PLACE', group: null, matchday: null });
    const match = normalizeMatch(raw);
    expect(match.stage).toBe('THIRD_PLACE');
    expect(match.group).toBeNull();
  });

  it('THIRD_PLACE match appears in correct bracket round', () => {
    const raw = makeRawMatch({ id: 99, stage: 'THIRD_PLACE', group: null, matchday: null });
    const match = normalizeMatch(raw);
    const rounds = buildBracket([match]);
    const thirdPlace = rounds.find(r => r.stage === 'THIRD_PLACE');
    expect(thirdPlace?.matches).toHaveLength(1);
    expect(thirdPlace?.matches[0].id).toBe(99);
  });
});

describe('GAP-HIGH: buildGroups — group ID parsed from GROUP_X suffix', () => {
  it('correctly handles GROUP_I (not confused with 1 or l)', () => {
    const groupI = makeRawStanding({ type: 'TOTAL', group: 'GROUP_I' });
    const groups = buildGroups([groupI], []);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('I');
    expect(groups[0].label).toBe('Group I');
  });

  it('correctly handles GROUP_L (last letter)', () => {
    const groupL = makeRawStanding({ type: 'TOTAL', group: 'GROUP_L' });
    const groups = buildGroups([groupL], []);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('L');
    expect(groups[0].label).toBe('Group L');
  });

  it('rejects GROUP_M (out of A-L range)', () => {
    const groupM = makeRawStanding({ type: 'TOTAL', group: 'GROUP_M' });
    const groups = buildGroups([groupM], []);
    expect(groups).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIUM — correctness assumptions not validated
// ═══════════════════════════════════════════════════════════════════════════════

describe('GAP-MEDIUM: sortStanding — all-zeros tiebreak falls back to name asc', () => {
  it('sorts teams with identical stats alphabetically by name', () => {
    const rows = [
      makeStanding({ position: 1, team: makeTeam({ name: 'Zebra FC' }),  points: 0, goalDifference: 0, goalsFor: 0 }),
      makeStanding({ position: 2, team: makeTeam({ name: 'Alpha FC' }),  points: 0, goalDifference: 0, goalsFor: 0 }),
      makeStanding({ position: 3, team: makeTeam({ name: 'Middle FC' }), points: 0, goalDifference: 0, goalsFor: 0 }),
    ];
    const sorted = sortStanding(rows);
    expect(sorted.map(r => r.team.name)).toEqual(['Alpha FC', 'Middle FC', 'Zebra FC']);
  });

  it('points tiebreak: higher GD wins over name alphabetic', () => {
    const a = makeStanding({ position: 1, team: makeTeam({ name: 'Zebra' }), points: 3, goalDifference: 2, goalsFor: 3 });
    const b = makeStanding({ position: 2, team: makeTeam({ name: 'Alpha' }), points: 3, goalDifference: 1, goalsFor: 2 });
    const sorted = sortStanding([a, b]);
    expect(sorted[0].team.name).toBe('Zebra');
  });
});

describe('GAP-MEDIUM: addDays — February boundary', () => {
  it('Feb 28 + 1 in a non-leap year gives Mar 1', () => {
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('Feb 28 + 1 in a leap year gives Feb 29', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('Feb 29 + 1 in a leap year gives Mar 1', () => {
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('Dec 31 + 1 wraps to Jan 1 of the next year', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('negative delta goes backward: Jan 1 − 1 = Dec 31 of prior year', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('GAP-MEDIUM: matchesForGroup — null matchday sorted before matchday 1', () => {
  it('match with null matchday sorts before matchday 1', () => {
    const nullMd = makeMatch({ id: 10, matchday: null, utcDate: '2026-07-01T18:00:00Z', group: 'A' });
    const md1   = makeMatch({ id: 11, matchday: 1,    utcDate: '2026-06-13T18:00:00Z', group: 'A' });
    const result = matchesForGroup([md1, nullMd], 'A');
    expect(result[0].id).toBe(10);
    expect(result[1].id).toBe(11);
  });
});

describe('GAP-MEDIUM: parseGroupId — all valid group IDs parse correctly', () => {
  const validGroups = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const;

  for (const id of validGroups) {
    it(`parses GROUP_${id} → "${id}"`, () => {
      expect(parseGroupId(`GROUP_${id}`)).toBe(id);
    });
  }

  it('returns null for GROUP_M (out of range)', () => {
    expect(parseGroupId('GROUP_M')).toBeNull();
  });

  it('returns null for lowercase group_a', () => {
    expect(parseGroupId('group_a')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseGroupId('')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseGroupId(null)).toBeNull();
  });
});

describe('GAP-MEDIUM: buildBracket — matches sorted by utcDate then id within a round', () => {
  it('sorts two ROUND_OF_32 matches by utcDate ascending', () => {
    const early = makeMatch({ id: 5,  stage: 'ROUND_OF_32', group: null, utcDate: '2026-06-29T14:00:00Z' });
    const late  = makeMatch({ id: 3,  stage: 'ROUND_OF_32', group: null, utcDate: '2026-06-29T18:00:00Z' });
    const rounds = buildBracket([late, early]);
    const r32 = rounds.find(r => r.stage === 'ROUND_OF_32')!;
    expect(r32.matches[0].id).toBe(5);
    expect(r32.matches[1].id).toBe(3);
  });

  it('breaks utcDate ties by id ascending', () => {
    const a = makeMatch({ id: 10, stage: 'ROUND_OF_32', group: null, utcDate: '2026-06-29T14:00:00Z' });
    const b = makeMatch({ id: 2,  stage: 'ROUND_OF_32', group: null, utcDate: '2026-06-29T14:00:00Z' });
    const rounds = buildBracket([a, b]);
    const r32 = rounds.find(r => r.stage === 'ROUND_OF_32')!;
    expect(r32.matches[0].id).toBe(2);
    expect(r32.matches[1].id).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOW — defensive/boundary cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('GAP-LOW: normalizeStatus — unknown raw status falls back to TIMED', () => {
  it('returns TIMED for an unrecognized raw status string', () => {
    // Cast to bypass TS so we can test the runtime fallback
    const result = normalizeStatus('UNKNOWN_FUTURE_STATUS' as never);
    expect(result).toBe('TIMED');
  });
});

describe('GAP-LOW: normalizeMatch — fullTime scores preserved', () => {
  it('preserves null fullTime scores when match is TIMED', () => {
    const raw = makeRawMatch({ status: 'TIMED' });
    const match = normalizeMatch(raw);
    expect(match.fullTime.home).toBeNull();
    expect(match.fullTime.away).toBeNull();
  });

  it('preserves non-null fullTime scores for a FINISHED match', () => {
    const raw = makeRawMatch({
      status: 'FINISHED',
      score: {
        winner: 'HOME_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 3, away: 1 },
        halfTime: { home: 1, away: 0 },
      },
    });
    const match = normalizeMatch(raw);
    expect(match.fullTime.home).toBe(3);
    expect(match.fullTime.away).toBe(1);
    expect(match.halfTime.home).toBe(1);
    expect(match.halfTime.away).toBe(0);
  });
});

describe('GAP-LOW: buildGroups — GROUP_ORDER determines output order', () => {
  it('returns Group A before Group B regardless of input order', () => {
    const groupB = makeRawStanding({ type: 'TOTAL', group: 'GROUP_B' });
    const groupA = makeRawStanding({ type: 'TOTAL', group: 'GROUP_A' });
    const groups = buildGroups([groupB, groupA], []);
    expect(groups[0].id).toBe('A');
    expect(groups[1].id).toBe('B');
  });
});
