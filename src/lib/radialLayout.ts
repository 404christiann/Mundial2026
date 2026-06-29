import type { BracketRound, Match, Stage, Team } from '@/types/domain';
import { placeByBracketTopology } from './knockoutTopology';

export interface RadialNode {
  key: string;
  matchId: number | null;
  stage: Stage;
  roundIndex: number;
  kind: 'crest' | 'dot';
  slot: number;
  team: Team | null;
  isTBD: boolean;
  isEliminated: boolean;
  angleDeg: number;
  radius: number;
  x: number;
  y: number;
  size: number;
}

export interface RadialEdge {
  key: string;
  child: { x: number; y: number };
  shoulder: { x: number; y: number };
  parent: { x: number; y: number };
  isWinnerPath: boolean;
}

export interface RadialRing {
  stage: Stage;
  roundIndex: number;
  radius: number;
  label: string;
  labelX: number;
  labelY: number;
}

export interface RadialLayout {
  size: number;
  center: { x: number; y: number };
  crestSize: number;
  innerCrestSize: number;
  crests: RadialNode[];
  participants: RadialNode[];
  dots: RadialNode[];
  entryEdges: RadialEdge[];
  edges: RadialEdge[];
  finalToCenter: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    isWinnerPath: boolean;
  };
  rings: RadialRing[];
  allEmpty: boolean;
}

const RADIAL_STAGES = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINAL',
] as const satisfies readonly Stage[];

const RING_LABELS: Record<(typeof RADIAL_STAGES)[number], string> = {
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  FINAL: 'Final',
};

const ROUND_MATCH_COUNTS = [16, 8, 4, 2, 1] as const;
const RADIUS_FRACTIONS = [1, 0.76, 0.55, 0.36, 0.18] as const;
const R32_ANCHOR_FRACTION = 0.88;
const PAD = 8;
const GAP = 0.86;
const SLOT_COUNT = 32;
const DOT_SIZE = 9;
const START_ANGLE = -90;
const STEP_ANGLE = 360 / SLOT_COUNT;
const HALF_CREST_RATIO = (Math.PI / SLOT_COUNT) * GAP;

function pointAt(center: { x: number; y: number }, radius: number, angleDeg: number) {
  const rad = angleDeg * Math.PI / 180;
  return {
    x: center.x + radius * Math.cos(rad),
    y: center.y + radius * Math.sin(rad),
  };
}

function matchAngle(roundIndex: number, matchIndex: number) {
  const span = 2 ** (roundIndex + 1);
  return START_ANGLE + (matchIndex * span + (span - 1) / 2) * STEP_ANGLE;
}

function teamIsKnown(team: Team | null | undefined) {
  return Boolean(team?.id != null && team.name && team.name !== 'TBD');
}

function isDecisiveFinished(match: Match | null | undefined) {
  return Boolean(
    match?.status === 'FINISHED'
    && (match.winner === 'HOME' || match.winner === 'AWAY'),
  );
}

function winningTeam(match: Match | null | undefined) {
  if (!isDecisiveFinished(match)) return null;
  return match?.winner === 'HOME' ? match.homeTeam : match?.awayTeam ?? null;
}

function isLosingSide(match: Match | null | undefined, side: 0 | 1) {
  if (!isDecisiveFinished(match)) return false;
  return (side === 0 && match?.winner === 'AWAY') || (side === 1 && match?.winner === 'HOME');
}

export function buildRadialBracketLayout(rounds: BracketRound[], containerWidth: number): RadialLayout {
  const size = Math.max(0, containerWidth);
  const center = { x: size / 2, y: size / 2 };
  const outerRadius = size > 0 ? (size / 2 - PAD) / (1 + HALF_CREST_RATIO) : 0;
  const crestSize = 2 * HALF_CREST_RATIO * outerRadius;
  const innerCrestSize = Math.max(14, crestSize * 0.52);
  const radii = RADIUS_FRACTIONS.map(fraction => outerRadius * fraction);
  const roundsByStage = new Map(rounds.map(round => [round.stage, round]));

  const matchesByRound = RADIAL_STAGES.map(stage => (
    placeByBracketTopology(stage, roundsByStage.get(stage)?.matches ?? [])
  ));

  const matchAnchor = (roundIndex: number, matchIndex: number) => {
    const angleDeg = matchAngle(roundIndex, matchIndex);
    const radius = roundIndex === 0 ? outerRadius * R32_ANCHOR_FRACTION : radii[roundIndex];
    return {
      angleDeg,
      ...pointAt(center, radius, angleDeg),
    };
  };

  const crests: RadialNode[] = Array.from({ length: SLOT_COUNT }, (_, slot) => {
    const matchIndex = Math.floor(slot / 2);
    const match = matchesByRound[0][matchIndex] ?? null;
    const team = match ? (slot % 2 === 0 ? match.homeTeam : match.awayTeam) : null;
    const angleDeg = START_ANGLE + slot * STEP_ANGLE;
    const point = pointAt(center, radii[0], angleDeg);

    return {
      key: `crest-${slot}`,
      matchId: match?.id ?? null,
      stage: 'ROUND_OF_32',
      roundIndex: 0,
      kind: 'crest',
      slot,
      team: teamIsKnown(team) ? team : null,
      isTBD: !teamIsKnown(team),
      isEliminated: isLosingSide(match, slot % 2 as 0 | 1),
      angleDeg,
      radius: radii[0],
      x: point.x,
      y: point.y,
      size: crestSize,
    };
  });

  const dots: RadialNode[] = RADIAL_STAGES.slice(1).flatMap((stage, relativeRoundIndex) => {
    const roundIndex = relativeRoundIndex + 1;
    const matches = matchesByRound[roundIndex];

    return Array.from({ length: ROUND_MATCH_COUNTS[roundIndex] }, (_, slot) => {
      const match = matches[slot] ?? null;
      const anchor = matchAnchor(roundIndex, slot);

      return {
        key: `dot-${stage}-${slot}`,
        matchId: match?.id ?? null,
        stage,
        roundIndex,
        kind: 'dot',
        slot,
        team: null,
        isTBD: !match,
        isEliminated: false,
        angleDeg: anchor.angleDeg,
        radius: radii[roundIndex],
        x: anchor.x,
        y: anchor.y,
        size: DOT_SIZE,
      };
    });
  });

  const participants: RadialNode[] = RADIAL_STAGES.slice(1).flatMap((stage, relativeRoundIndex) => {
    const roundIndex = relativeRoundIndex + 1;
    const matches = matchesByRound[roundIndex];

    return Array.from({ length: ROUND_MATCH_COUNTS[roundIndex] }, (_, matchIndex) => {
      const match = matches[matchIndex] ?? null;

      return [0, 1].map(side => {
        const childIndex = matchIndex * 2 + side;
        const apiTeam = match ? (side === 0 ? match.homeTeam : match.awayTeam) : null;
        const childWinner = winningTeam(matchesByRound[roundIndex - 1][childIndex]);
        const team = teamIsKnown(apiTeam) ? apiTeam : childWinner;
        const angleDeg = matchAngle(roundIndex - 1, childIndex);
        const point = pointAt(center, radii[roundIndex], angleDeg);

        return {
          key: `participant-${stage}-${matchIndex}-${side}`,
          matchId: match?.id ?? matchesByRound[roundIndex - 1][childIndex]?.id ?? null,
          stage,
          roundIndex,
          kind: 'crest' as const,
          slot: childIndex,
          team: teamIsKnown(team) ? team : null,
          isTBD: !teamIsKnown(team),
          isEliminated: isLosingSide(match, side as 0 | 1),
          angleDeg,
          radius: radii[roundIndex],
          x: point.x,
          y: point.y,
          size: innerCrestSize,
        };
      });
    }).flat();
  });

  const entryEdges: RadialEdge[] = Array.from({ length: ROUND_MATCH_COUNTS[0] }, (_, matchIndex) => {
    const match = matchesByRound[0][matchIndex] ?? null;
    const parentAnchor = matchAnchor(0, matchIndex);

    return [0, 1].map(side => {
      const crest = crests[matchIndex * 2 + side];
      const winnerForSide = side === 0 ? 'HOME' : 'AWAY';

      return {
        key: `entry-edge-${matchIndex}-${side}`,
        child: { x: crest.x, y: crest.y },
        shoulder: { x: parentAnchor.x, y: parentAnchor.y },
        parent: { x: parentAnchor.x, y: parentAnchor.y },
        isWinnerPath: Boolean(match?.status === 'FINISHED' && match.winner === winnerForSide),
      };
    });
  }).flat();

  const edges: RadialEdge[] = [];

  for (let parentRoundIndex = 1; parentRoundIndex < RADIAL_STAGES.length; parentRoundIndex += 1) {
    for (let parentIndex = 0; parentIndex < ROUND_MATCH_COUNTS[parentRoundIndex]; parentIndex += 1) {
      const parentAnchor = matchAnchor(parentRoundIndex, parentIndex);
      const visualParent = parentRoundIndex === RADIAL_STAGES.length - 1
        ? { ...center, angleDeg: parentAnchor.angleDeg }
        : parentAnchor;

      for (const childOffset of [0, 1]) {
        const childIndex = parentIndex * 2 + childOffset;
        const childAnchor = matchAnchor(parentRoundIndex - 1, childIndex);
        const shoulder = parentRoundIndex === RADIAL_STAGES.length - 1
          ? visualParent
          : pointAt(center, radii[parentRoundIndex], childAnchor.angleDeg);
        const childMatch = matchesByRound[parentRoundIndex - 1][childIndex] ?? null;

        edges.push({
          key: `edge-${parentRoundIndex}-${parentIndex}-${childOffset}`,
          child: { x: childAnchor.x, y: childAnchor.y },
          shoulder,
          parent: { x: visualParent.x, y: visualParent.y },
          isWinnerPath: isDecisiveFinished(childMatch),
        });
      }
    }
  }

  const finalAnchor = matchAnchor(4, 0);
  const finalMatch = matchesByRound[4][0] ?? null;
  const rings = RADIAL_STAGES.map((stage, roundIndex) => ({
    stage,
    roundIndex,
    radius: radii[roundIndex],
    label: RING_LABELS[stage],
    labelX: center.x,
    labelY: center.y - radii[roundIndex],
  }));

  const allEmpty = matchesByRound
    .flat()
    .every(match => !match || (!teamIsKnown(match.homeTeam) && !teamIsKnown(match.awayTeam)));

  return {
    size,
    center,
    crestSize,
    innerCrestSize,
    crests,
    participants,
    dots,
    entryEdges,
    edges,
    finalToCenter: {
      from: { x: finalAnchor.x, y: finalAnchor.y },
      to: center,
      isWinnerPath: isDecisiveFinished(finalMatch),
    },
    rings,
    allEmpty,
  };
}
