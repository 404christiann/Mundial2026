export type MatchStatus = 'TIMED' | 'IN_PLAY' | 'FINISHED' | 'POSTPONED';
export type Stage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL';
export type GroupId = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';

export interface Team {
  id: number | null;
  name: string;
  tla: string;
  crest: string | null;
}

export interface Score { home: number | null; away: number | null; }

export interface Match {
  id: number;
  utcDate: string;
  status: MatchStatus;
  isLive: boolean;
  stage: Stage;
  matchday: number | null;
  group: GroupId | null;
  venue: string | null;
  homeTeam: Team;
  awayTeam: Team;
  fullTime: Score;
  halfTime: Score;
  winner: 'HOME' | 'AWAY' | 'DRAW' | null;
}

export interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualifying: boolean;
}

export interface Group {
  id: GroupId;
  label: string;
  standings: Standing[];
  matches: Match[];
}

export interface BracketRound {
  stage: Stage;
  label: string;
  matches: Match[];
}

export interface TournamentContext {
  currentStage: Stage;
  stageLabel: string;
  defaultTab: 'schedule' | 'bracket';
}
