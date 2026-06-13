import type { Match, Stage, TournamentContext } from '@/types/domain';
import { ROUND_ORDER, STAGE_LABELS } from './constants';

const STAGE_PRIORITY: Stage[] = ['GROUP_STAGE', ...ROUND_ORDER];

function isActiveIncomplete(match: Match): boolean {
  return match.status !== 'FINISHED' && match.status !== 'POSTPONED';
}

export function formatStageLabel(stage: Stage, _matchday: number | null): string {
  if (stage === 'GROUP_STAGE') {
    return 'Group Stage';
  }
  return STAGE_LABELS[stage];
}

export function detectStage(matches: Match[]): TournamentContext {
  if (matches.length === 0) {
    return {
      currentStage: 'GROUP_STAGE',
      stageLabel: formatStageLabel('GROUP_STAGE', null),
      defaultTab: 'schedule',
    };
  }

  for (const stage of STAGE_PRIORITY) {
    const stageMatches = matches.filter(m => m.stage === stage);
    if (stageMatches.length === 0) continue;

    const incomplete = stageMatches.filter(isActiveIncomplete);
    if (incomplete.length === 0) continue;

    if (stage === 'GROUP_STAGE') {
      return {
        currentStage: 'GROUP_STAGE',
        stageLabel: formatStageLabel('GROUP_STAGE', null),
        defaultTab: 'schedule',
      };
    }

    return {
      currentStage: stage,
      stageLabel: formatStageLabel(stage, null),
      defaultTab: 'bracket',
    };
  }

  // All matches finished — find the last stage present
  const presentStages = STAGE_PRIORITY.filter(s => matches.some(m => m.stage === s));
  const lastStage = presentStages[presentStages.length - 1] ?? 'FINAL';

  return {
    currentStage: lastStage,
    stageLabel: formatStageLabel(lastStage, null),
    defaultTab: lastStage === 'GROUP_STAGE' ? 'schedule' : 'bracket',
  };
}

export function getDefaultTab(ctx: TournamentContext): 'schedule' | 'bracket' {
  return ctx.defaultTab;
}
