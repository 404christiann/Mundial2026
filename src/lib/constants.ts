import type { Stage, GroupId } from '@/types/domain';

export const TOURNAMENT_START = '2026-06-11';
export const TOURNAMENT_END   = '2026-07-19';

export const ROUND_ORDER: Stage[] = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
];

export const GROUP_ORDER: GroupId[] = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter Finals',
  SEMI_FINALS: 'Semi Finals',
  THIRD_PLACE: 'Third Place',
  FINAL: 'Final',
};

export const POLL_INTERVAL_MS = 60_000;
export const MATCHES_TTL_MS = 60_000;
export const STANDINGS_TTL_MS = 300_000;
