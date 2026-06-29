import { describe, expect, it } from 'vitest';
import { buildBracket } from '@/lib/bracket';
import { buildRadialBracketLayout } from '@/lib/radialLayout';
import { makeFinishedMatch, makeMatch } from '../fixtures';
import type { Match } from '@/types/domain';

function fullKnockoutMatches(): Match[] {
  return [
    ...Array.from({ length: 16 }, (_, i) => makeFinishedMatch({
      id: i + 1,
      stage: 'ROUND_OF_32',
      matchday: null,
      group: null,
      homeTeam: { id: i * 2 + 1, name: `Home ${i}`, tla: `H${i}`, crest: `https://example.com/h${i}.svg` },
      awayTeam: { id: i * 2 + 2, name: `Away ${i}`, tla: `A${i}`, crest: `https://example.com/a${i}.svg` },
    })),
    ...Array.from({ length: 8 }, (_, i) => makeFinishedMatch({ id: i + 17, stage: 'ROUND_OF_16', matchday: null, group: null })),
    ...Array.from({ length: 4 }, (_, i) => makeFinishedMatch({ id: i + 25, stage: 'QUARTER_FINALS', matchday: null, group: null })),
    ...Array.from({ length: 2 }, (_, i) => makeFinishedMatch({ id: i + 29, stage: 'SEMI_FINALS', matchday: null, group: null })),
    makeFinishedMatch({ id: 31, stage: 'FINAL', matchday: null, group: null }),
  ];
}

describe('buildRadialBracketLayout', () => {
  it('always emits full radial geometry', () => {
    const layout = buildRadialBracketLayout(buildBracket([]), 375);

    expect(layout.crests).toHaveLength(32);
    expect(layout.participants).toHaveLength(30);
    expect(layout.dots).toHaveLength(15);
    expect(layout.entryEdges).toHaveLength(32);
    expect(layout.edges).toHaveLength(30);
    expect(layout.rings.map(r => r.label)).toEqual(['R32', 'R16', 'QF', 'SF', 'Final']);
  });

  it('sizes the outer ring so mobile crests fit inside a 375px canvas', () => {
    const layout = buildRadialBracketLayout(buildBracket([]), 375);
    const outer = layout.rings[0].radius;

    expect(layout.crestSize).toBeGreaterThanOrEqual(27);
    expect(layout.crestSize).toBeLessThanOrEqual(29);
    expect(outer + layout.crestSize / 2).toBeCloseTo(375 / 2 - 8, 5);
  });

  it('places slot 0 at 12 o clock and parent nodes at child-span midpoints', () => {
    const layout = buildRadialBracketLayout(buildBracket([]), 375);
    const slot0 = layout.crests[0];
    const firstR16Dot = layout.dots.find(dot => dot.stage === 'ROUND_OF_16' && dot.slot === 0);

    expect(slot0.angleDeg).toBe(-90);
    expect(slot0.x).toBeCloseTo(layout.center.x, 5);
    expect(slot0.y).toBeLessThan(layout.center.y);
    expect(firstR16Dot?.angleDeg).toBeCloseTo(-73.125, 5);
  });

  it('marks winner-path edges from decisive finished child matches', () => {
    const rounds = buildBracket([
      makeFinishedMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null, winner: 'HOME' }),
      makeMatch({ id: 2, stage: 'ROUND_OF_32', matchday: null, group: null, status: 'TIMED', winner: null }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);

    expect(layout.edges[0].isWinnerPath).toBe(true);
    expect(layout.edges[1].isWinnerPath).toBe(false);
  });

  it('aligns outer entry edges to actual team crest slots', () => {
    const rounds = buildBracket([
      makeFinishedMatch({ id: 1, stage: 'ROUND_OF_32', matchday: null, group: null, winner: 'AWAY' }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);

    expect(layout.entryEdges[0].child).toEqual({ x: layout.crests[0].x, y: layout.crests[0].y });
    expect(layout.entryEdges[1].child).toEqual({ x: layout.crests[1].x, y: layout.crests[1].y });
    expect(layout.entryEdges[0].shoulder).toEqual(layout.entryEdges[0].parent);
    expect(layout.entryEdges[1].shoulder).toEqual(layout.entryEdges[1].parent);
    expect(layout.entryEdges[0].isWinnerPath).toBe(false);
    expect(layout.entryEdges[1].isWinnerPath).toBe(true);
  });

  it('marks losing outer-ring teams as eliminated', () => {
    const rounds = buildBracket([
      makeFinishedMatch({
        id: 1,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: { id: 1, name: 'Brazil', tla: 'BRA', crest: null },
        awayTeam: { id: 2, name: 'Japan', tla: 'JPN', crest: null },
        winner: 'HOME',
      }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);
    const brazil = layout.crests.find(node => node.team?.name === 'Brazil');
    const japan = layout.crests.find(node => node.team?.name === 'Japan');

    expect(brazil?.isEliminated).toBe(false);
    expect(japan?.isEliminated).toBe(true);
  });

  it('renders known advanced teams as participant crests on inner rings', () => {
    const canada = { id: 828, name: 'Canada', tla: 'CAN', crest: 'https://example.com/canada.svg' };
    const rounds = buildBracket([
      makeFinishedMatch({
        id: 1,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: { id: 774, name: 'South Africa', tla: 'RSA', crest: null },
        awayTeam: canada,
        winner: 'AWAY',
      }),
      makeMatch({
        id: 17,
        stage: 'ROUND_OF_16',
        matchday: null,
        group: null,
        homeTeam: canada,
        awayTeam: { id: null, name: 'TBD', tla: '', crest: null },
      }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);
    const canadaNode = layout.participants.find(node => node.stage === 'ROUND_OF_16' && node.team?.name === 'Canada');

    expect(canadaNode).toBeDefined();
    expect(canadaNode?.roundIndex).toBe(1);
    expect(canadaNode?.isTBD).toBe(false);
  });

  it('uses official topology so Canada advances toward Netherlands or Morocco', () => {
    const canada = { id: 828, name: 'Canada', tla: 'CAN', crest: 'https://example.com/canada.svg' };
    const rounds = buildBracket([
      makeFinishedMatch({
        id: 537417,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: { id: 774, name: 'South Africa', tla: 'RSA', crest: null },
        awayTeam: canada,
        winner: 'AWAY',
      }),
      makeMatch({
        id: 537418,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: { id: 8601, name: 'Netherlands', tla: 'NED', crest: null },
        awayTeam: { id: 815, name: 'Morocco', tla: 'MAR', crest: null },
      }),
      makeMatch({
        id: 537376,
        stage: 'ROUND_OF_16',
        matchday: null,
        group: null,
        homeTeam: canada,
        awayTeam: { id: null, name: 'TBD', tla: '', crest: null },
      }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);
    const canadaOuter = layout.crests.find(node => node.team?.name === 'Canada');
    const canadaInner = layout.participants.find(node => node.stage === 'ROUND_OF_16' && node.team?.name === 'Canada');
    const netherlandsOuter = layout.crests.find(node => node.team?.name === 'Netherlands');

    expect(canadaOuter?.slot).toBe(5);
    expect(netherlandsOuter?.slot).toBe(6);
    expect(canadaInner?.slot).toBe(2);
  });

  it('projects Canada into Match 90 from the completed South Africa match when the R16 API slot is empty', () => {
    const canada = { id: 828, name: 'Canada', tla: 'CAN', crest: 'https://example.com/canada.svg' };
    const rounds = buildBracket([
      makeFinishedMatch({
        id: 537417,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: { id: 774, name: 'South Africa', tla: 'RSA', crest: null },
        awayTeam: canada,
        winner: 'AWAY',
      }),
      makeMatch({
        id: 537376,
        stage: 'ROUND_OF_16',
        matchday: null,
        group: null,
        homeTeam: { id: null, name: 'TBD', tla: '', crest: null },
        awayTeam: { id: null, name: 'TBD', tla: '', crest: null },
      }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);
    const canadaInner = layout.participants.find(node => node.stage === 'ROUND_OF_16' && node.team?.name === 'Canada');

    expect(canadaInner).toBeDefined();
    expect(canadaInner?.matchId).toBe(537376);
    expect(canadaInner?.slot).toBe(2);
  });

  it('projects Brazil into Match 91 from the completed Japan match when football-data has not filled R16 yet', () => {
    const brazil = { id: 764, name: 'Brazil', tla: 'BRA', crest: 'https://example.com/brazil.svg' };
    const rounds = buildBracket([
      makeFinishedMatch({
        id: 537423,
        stage: 'ROUND_OF_32',
        matchday: null,
        group: null,
        homeTeam: brazil,
        awayTeam: { id: 766, name: 'Japan', tla: 'JPN', crest: null },
        winner: 'HOME',
      }),
      makeMatch({
        id: 537377,
        stage: 'ROUND_OF_16',
        matchday: null,
        group: null,
        homeTeam: { id: null, name: 'TBD', tla: '', crest: null },
        awayTeam: { id: null, name: 'TBD', tla: '', crest: null },
      }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);
    const brazilInner = layout.participants.find(node => node.stage === 'ROUND_OF_16' && node.team?.name === 'Brazil');

    expect(brazilInner).toBeDefined();
    expect(brazilInner?.matchId).toBe(537377);
    expect(brazilInner?.slot).toBe(8);
  });

  it('uses stepped connectors between knockout rounds', () => {
    const layout = buildRadialBracketLayout(buildBracket([]), 375);

    expect(layout.edges[0].shoulder).not.toEqual(layout.edges[0].parent);
  });

  it('connects semifinal winners directly into the trophy center', () => {
    const layout = buildRadialBracketLayout(buildBracket([]), 375);
    const finalEdges = layout.edges.slice(-2);

    expect(finalEdges[0].parent).toEqual(layout.center);
    expect(finalEdges[1].parent).toEqual(layout.center);
  });

  it('lights the final-to-center connector when the final has a decisive winner', () => {
    const rounds = buildBracket([
      makeFinishedMatch({ id: 100, stage: 'FINAL', matchday: null, group: null, winner: 'AWAY' }),
    ]);
    const layout = buildRadialBracketLayout(rounds, 375);

    expect(layout.finalToCenter.isWinnerPath).toBe(true);
  });

  it('detects empty and populated knockout states by known teams', () => {
    const empty = buildRadialBracketLayout(buildBracket([]), 375);
    const populated = buildRadialBracketLayout(buildBracket(fullKnockoutMatches()), 375);

    expect(empty.allEmpty).toBe(true);
    expect(populated.allEmpty).toBe(false);
  });
});
