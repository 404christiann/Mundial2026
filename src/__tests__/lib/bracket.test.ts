import { describe, it, expect } from 'vitest';
import { buildBracket } from '@/lib/bracket';
import { makeMatch, makeFinishedMatch, ALL_BRACKET_STAGES } from '../fixtures';
import type { Match } from '@/types/domain';

const EXPECTED_ROUND_COUNT = 6; // R32, R16, QF, SF, 3rd, Final

describe('buildBracket', () => {
  it('always returns all 6 rounds even with no knockout matches', () => {
    const rounds = buildBracket([]);
    expect(rounds).toHaveLength(EXPECTED_ROUND_COUNT);
  });

  it('always returns all 6 rounds when only group stage matches exist', () => {
    const matches = [makeMatch({ stage: 'GROUP_STAGE' }), makeFinishedMatch({ stage: 'GROUP_STAGE' })];
    const rounds = buildBracket(matches);
    expect(rounds).toHaveLength(EXPECTED_ROUND_COUNT);
  });

  it('returns rounds in correct order: R32 → R16 → QF → SF → 3rd → Final', () => {
    const rounds = buildBracket([]);
    expect(rounds.map(r => r.stage)).toEqual([
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'THIRD_PLACE',
      'FINAL',
    ]);
  });

  it('populates matches into the correct round', () => {
    const r32Match = makeMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null });
    const qfMatch = makeMatch({ id: 2, stage: 'QUARTER_FINALS', matchday: null, group: null });
    const rounds = buildBracket([r32Match, qfMatch]);

    const r32 = rounds.find(r => r.stage === 'ROUND_OF_32')!;
    const qf = rounds.find(r => r.stage === 'QUARTER_FINALS')!;
    const r16 = rounds.find(r => r.stage === 'ROUND_OF_16')!;

    expect(r32.matches).toHaveLength(1);
    expect(r32.matches[0].id).toBe(1);
    expect(qf.matches).toHaveLength(1);
    expect(qf.matches[0].id).toBe(2);
    expect(r16.matches).toHaveLength(0);
  });

  it('empty rounds still have the correct stage and label', () => {
    const rounds = buildBracket([]);
    for (const stage of ALL_BRACKET_STAGES) {
      const round = rounds.find(r => r.stage === stage);
      expect(round).toBeDefined();
      expect(round!.matches).toEqual([]);
      expect(round!.label).toBeTruthy();
    }
  });

  it('sorts matches within a round by utcDate ascending', () => {
    const matches: Match[] = [
      makeMatch({ id: 3, stage: 'ROUND_OF_32', matchday: null, group: null, utcDate: '2026-07-01T20:00:00Z' }),
      makeMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null, utcDate: '2026-06-28T16:00:00Z' }),
      makeMatch({ id: 2, stage: 'ROUND_OF_32', matchday: null, group: null, utcDate: '2026-06-29T18:00:00Z' }),
    ];
    const rounds = buildBracket(matches);
    const r32 = rounds.find(r => r.stage === 'ROUND_OF_32')!;
    expect(r32.matches.map(m => m.id)).toEqual([1, 2, 3]);
  });

  it('breaks utcDate ties by id ascending', () => {
    const sameDate = '2026-06-28T16:00:00Z';
    const matches: Match[] = [
      makeMatch({ id: 5, stage: 'ROUND_OF_32', matchday: null, group: null, utcDate: sameDate }),
      makeMatch({ id: 2, stage: 'ROUND_OF_32', matchday: null, group: null, utcDate: sameDate }),
    ];
    const rounds = buildBracket(matches);
    const r32 = rounds.find(r => r.stage === 'ROUND_OF_32')!;
    expect(r32.matches.map(m => m.id)).toEqual([2, 5]);
  });

  it('excludes GROUP_STAGE matches from all rounds', () => {
    const matches = [
      makeMatch({ id: 1, stage: 'GROUP_STAGE' }),
      makeMatch({ id: 2, stage: 'ROUND_OF_32', matchday: null, group: null }),
    ];
    const rounds = buildBracket(matches);
    const allMatchIds = rounds.flatMap(r => r.matches.map(m => m.id));
    expect(allMatchIds).not.toContain(1);
    expect(allMatchIds).toContain(2);
  });

  it('includes THIRD_PLACE round before FINAL', () => {
    const rounds = buildBracket([]);
    const stages = rounds.map(r => r.stage);
    const thirdIdx = stages.indexOf('THIRD_PLACE');
    const finalIdx = stages.indexOf('FINAL');
    expect(thirdIdx).toBeLessThan(finalIdx);
    expect(thirdIdx).toBeGreaterThan(-1);
  });

  it('round labels are human-readable strings', () => {
    const rounds = buildBracket([]);
    for (const round of rounds) {
      expect(typeof round.label).toBe('string');
      expect(round.label.length).toBeGreaterThan(0);
    }
  });

  it('handles a fully populated knockout bracket', () => {
    const matches: Match[] = [
      ...Array.from({ length: 16 }, (_, i) => makeFinishedMatch({ id: i + 1, stage: 'ROUND_OF_32', matchday: null, group: null })),
      ...Array.from({ length: 8 }, (_, i) => makeFinishedMatch({ id: i + 17, stage: 'ROUND_OF_16', matchday: null, group: null })),
      ...Array.from({ length: 4 }, (_, i) => makeFinishedMatch({ id: i + 25, stage: 'QUARTER_FINALS', matchday: null, group: null })),
      ...Array.from({ length: 2 }, (_, i) => makeFinishedMatch({ id: i + 29, stage: 'SEMI_FINALS', matchday: null, group: null })),
      makeMatch({ id: 31, stage: 'THIRD_PLACE', matchday: null, group: null, status: 'TIMED' }),
      makeMatch({ id: 32, stage: 'FINAL', matchday: null, group: null, status: 'TIMED' }),
    ];
    const rounds = buildBracket(matches);
    expect(rounds).toHaveLength(EXPECTED_ROUND_COUNT);
    expect(rounds.find(r => r.stage === 'ROUND_OF_32')!.matches).toHaveLength(16);
    expect(rounds.find(r => r.stage === 'ROUND_OF_16')!.matches).toHaveLength(8);
    expect(rounds.find(r => r.stage === 'QUARTER_FINALS')!.matches).toHaveLength(4);
    expect(rounds.find(r => r.stage === 'SEMI_FINALS')!.matches).toHaveLength(2);
    expect(rounds.find(r => r.stage === 'THIRD_PLACE')!.matches).toHaveLength(1);
    expect(rounds.find(r => r.stage === 'FINAL')!.matches).toHaveLength(1);
  });
});
