export type RawStatus = 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
export type RawStage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL';

export interface RawTeam {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

export interface RawScoreSide { home: number | null; away: number | null; }

export interface RawScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string;
  fullTime: RawScoreSide;
  halfTime: RawScoreSide;
  regularTime?: RawScoreSide;
  extraTime?: RawScoreSide;
  penalties?: RawScoreSide;
}

export interface RawMatch {
  id: number;
  utcDate: string;
  status: RawStatus;
  matchday: number | null;
  stage: RawStage;
  group: string | null;
  venue: string | null;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score: RawScore;
}

export interface RawMatchesResponse {
  matches: RawMatch[];
  resultSet?: { count: number };
}

export interface RawStandingTableRow {
  position: number;
  team: RawTeam;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface RawStanding {
  stage: RawStage;
  type: 'TOTAL' | 'HOME' | 'AWAY';
  group: string | null;
  table: RawStandingTableRow[];
}

export interface RawStandingsResponse { standings: RawStanding[]; }
