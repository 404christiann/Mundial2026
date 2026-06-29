import type { Match, Stage } from '@/types/domain';

export const MATCH_NUMBER_BY_FOOTBALL_DATA_ID: Record<number, number> = {
  537417: 73,
  537415: 74,
  537418: 75,
  537423: 76,
  537416: 77,
  537424: 78,
  537425: 79,
  537426: 80,
  537421: 81,
  537422: 82,
  537419: 83,
  537420: 84,
  537429: 85,
  537427: 86,
  537430: 87,
  537428: 88,
  537375: 89,
  537376: 90,
  537377: 91,
  537378: 92,
  537379: 93,
  537380: 94,
  537381: 95,
  537382: 96,
  537383: 97,
  537384: 98,
  537385: 99,
  537386: 100,
  537387: 101,
  537388: 102,
  537389: 103,
  537390: 104,
};

const MATCH_ORDER_BY_STAGE: Partial<Record<Stage, number[]>> = {
  ROUND_OF_32: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  ROUND_OF_16: [89, 90, 93, 94, 91, 92, 95, 96],
  QUARTER_FINALS: [97, 98, 99, 100],
  SEMI_FINALS: [101, 102],
  FINAL: [104],
};

export function matchNumber(match: Match) {
  return MATCH_NUMBER_BY_FOOTBALL_DATA_ID[match.id] ?? null;
}

export function sortByBracketTopology(stage: Stage, matches: Match[]) {
  const order = MATCH_ORDER_BY_STAGE[stage];
  if (!order) return matches;

  return [...matches].sort((a, b) => {
    const aNumber = matchNumber(a);
    const bNumber = matchNumber(b);
    const aIndex = aNumber == null ? Number.POSITIVE_INFINITY : order.indexOf(aNumber);
    const bIndex = bNumber == null ? Number.POSITIVE_INFINITY : order.indexOf(bNumber);
    const normalizedAIndex = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex;
    const normalizedBIndex = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex;

    if (normalizedAIndex !== normalizedBIndex) return normalizedAIndex - normalizedBIndex;
    return a.utcDate.localeCompare(b.utcDate) || a.id - b.id;
  });
}

export function placeByBracketTopology(stage: Stage, matches: Match[]) {
  const order = MATCH_ORDER_BY_STAGE[stage];
  if (!order) return matches;

  const slots: Array<Match | undefined> = Array.from({ length: order.length });
  const fallback: Match[] = [];

  for (const match of matches) {
    const number = matchNumber(match);
    const index = number == null ? -1 : order.indexOf(number);

    if (index >= 0) {
      slots[index] = match;
    } else {
      fallback.push(match);
    }
  }

  for (const match of fallback.sort((a, b) => a.utcDate.localeCompare(b.utcDate) || a.id - b.id)) {
    const index = slots.findIndex(slot => slot == null);
    if (index === -1) break;
    slots[index] = match;
  }

  return slots;
}
