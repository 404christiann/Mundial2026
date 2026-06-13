import type { Match, BracketRound } from '@/types/domain';
import { ROUND_ORDER, STAGE_LABELS } from './constants';

export function buildBracket(matches: Match[]): BracketRound[] {
  const knockouts = matches.filter(m => m.stage !== 'GROUP_STAGE');

  return ROUND_ORDER.map(stage => {
    const stageMatches = knockouts
      .filter(m => m.stage === stage)
      .sort((a, b) => {
        const dateDiff = a.utcDate.localeCompare(b.utcDate);
        return dateDiff !== 0 ? dateDiff : a.id - b.id;
      });

    return {
      stage,
      label: STAGE_LABELS[stage],
      matches: stageMatches,
    };
  });
}
