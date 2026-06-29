import { describe, expect, it } from 'vitest';
import { placeByBracketTopology, sortByBracketTopology } from '@/lib/knockoutTopology';
import { makeMatch } from '../fixtures';
import type { Match } from '@/types/domain';

describe('knockout topology', () => {
  it('orders R32 matches by bracket path instead of date order', () => {
    const matches: Match[] = [
      makeMatch({ id: 537423, stage: 'ROUND_OF_32', utcDate: '2026-06-29T17:00:00Z' }), // Match 76
      makeMatch({ id: 537417, stage: 'ROUND_OF_32', utcDate: '2026-06-28T19:00:00Z' }), // Match 73
      makeMatch({ id: 537418, stage: 'ROUND_OF_32', utcDate: '2026-06-30T01:00:00Z' }), // Match 75
      makeMatch({ id: 537415, stage: 'ROUND_OF_32', utcDate: '2026-06-29T20:30:00Z' }), // Match 74
      makeMatch({ id: 537416, stage: 'ROUND_OF_32', utcDate: '2026-06-30T21:00:00Z' }), // Match 77
    ];

    expect(sortByBracketTopology('ROUND_OF_32', matches).map(match => match.id)).toEqual([
      537415,
      537416,
      537417,
      537418,
      537423,
    ]);
  });

  it('places Match 90 after Match 89 in R16 bracket order', () => {
    const matches = [
      makeMatch({ id: 537376, stage: 'ROUND_OF_16', utcDate: '2026-07-04T17:00:00Z' }),
      makeMatch({ id: 537375, stage: 'ROUND_OF_16', utcDate: '2026-07-04T21:00:00Z' }),
    ];

    expect(sortByBracketTopology('ROUND_OF_16', matches).map(match => match.id)).toEqual([
      537375,
      537376,
    ]);
  });

  it('keeps partial official matches in their true topology slots', () => {
    const southAfricaCanada = makeMatch({ id: 537417, stage: 'ROUND_OF_32' });
    const netherlandsMorocco = makeMatch({ id: 537418, stage: 'ROUND_OF_32' });
    const slots = placeByBracketTopology('ROUND_OF_32', [southAfricaCanada, netherlandsMorocco]);

    expect(slots[2]?.id).toBe(537417);
    expect(slots[3]?.id).toBe(537418);
  });
});
