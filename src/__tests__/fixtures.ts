import type { RawMatch, RawTeam, RawStanding, RawStandingTableRow } from '@/types/football';
import type { Match, Team, Standing, Group, BracketRound, Score } from '@/types/domain';

// ─── Raw API factories ────────────────────────────────────────────────────────

export function makeRawTeam(overrides: Partial<RawTeam> = {}): RawTeam {
  return {
    id: 769,
    name: 'Mexico',
    shortName: 'Mexico',
    tla: 'MEX',
    crest: 'https://crests.football-data.org/769.svg',
    ...overrides,
  };
}

export function makeRawMatch(overrides: Partial<RawMatch> = {}): RawMatch {
  return {
    id: 1,
    utcDate: '2026-06-13T18:00:00Z',
    status: 'TIMED',
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    venue: 'Estadio Azteca',
    homeTeam: makeRawTeam(),
    awayTeam: makeRawTeam({ id: 770, name: 'Poland', shortName: 'Poland', tla: 'POL' }),
    score: {
      winner: null,
      duration: 'REGULAR',
      fullTime: { home: null, away: null },
      halfTime: { home: null, away: null },
    },
    ...overrides,
  };
}

export function makeRawStandingRow(overrides: Partial<RawStandingTableRow> = {}): RawStandingTableRow {
  return {
    position: 1,
    team: makeRawTeam(),
    playedGames: 1,
    won: 1,
    draw: 0,
    lost: 0,
    points: 3,
    goalsFor: 2,
    goalsAgainst: 0,
    goalDifference: 2,
    ...overrides,
  };
}

export function makeRawStanding(overrides: Partial<RawStanding> = {}): RawStanding {
  return {
    stage: 'GROUP_STAGE',
    type: 'TOTAL',
    group: 'GROUP_A',
    table: [
      makeRawStandingRow({ position: 1 }),
      makeRawStandingRow({ position: 2, team: makeRawTeam({ id: 770, name: 'Poland', tla: 'POL' }), won: 0, draw: 1, lost: 0, points: 1, goalsFor: 1, goalsAgainst: 1, goalDifference: 0 }),
      makeRawStandingRow({ position: 3, team: makeRawTeam({ id: 771, name: 'Saudi Arabia', tla: 'KSA' }), won: 0, draw: 0, lost: 1, points: 0, goalsFor: 0, goalsAgainst: 2, goalDifference: -2 }),
      makeRawStandingRow({ position: 4, team: makeRawTeam({ id: 772, name: 'South Korea', tla: 'KOR' }), won: 0, draw: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }),
    ],
    ...overrides,
  };
}

// ─── Domain factories ─────────────────────────────────────────────────────────

export function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 769,
    name: 'Mexico',
    tla: 'MEX',
    crest: 'https://crests.football-data.org/769.svg',
    ...overrides,
  };
}

export function makeScore(overrides: Partial<Score> = {}): Score {
  return { home: null, away: null, ...overrides };
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    utcDate: '2026-06-13T18:00:00Z',
    status: 'TIMED',
    isLive: false,
    stage: 'GROUP_STAGE',
    matchday: 1,
    group: 'A',
    venue: 'Estadio Azteca',
    city: null,
    homeTeam: makeTeam(),
    awayTeam: makeTeam({ id: 770, name: 'Poland', tla: 'POL' }),
    fullTime: makeScore(),
    halfTime: makeScore(),
    winner: null,
    ...overrides,
  };
}

export function makeLiveMatch(overrides: Partial<Match> = {}): Match {
  return makeMatch({ status: 'IN_PLAY', isLive: true, ...overrides });
}

export function makeFinishedMatch(overrides: Partial<Match> = {}): Match {
  return makeMatch({
    status: 'FINISHED',
    isLive: false,
    fullTime: { home: 2, away: 0 },
    winner: 'HOME',
    ...overrides,
  });
}

export function makeStanding(overrides: Partial<Standing> = {}): Standing {
  return {
    position: 1,
    team: makeTeam(),
    played: 1,
    won: 1,
    draw: 0,
    lost: 0,
    goalsFor: 2,
    goalsAgainst: 0,
    goalDifference: 2,
    points: 3,
    qualifying: true,
    ...overrides,
  };
}

export function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'A',
    label: 'Group A',
    standings: [
      makeStanding({ position: 1 }),
      makeStanding({ position: 2, team: makeTeam({ id: 770, name: 'Poland', tla: 'POL' }), qualifying: true }),
      makeStanding({ position: 3, team: makeTeam({ id: 771, name: 'Saudi Arabia', tla: 'KSA' }), qualifying: false }),
      makeStanding({ position: 4, team: makeTeam({ id: 772, name: 'South Korea', tla: 'KOR' }), qualifying: false }),
    ],
    matches: [makeMatch(), makeMatch({ id: 2 }), makeMatch({ id: 3 })],
    ...overrides,
  };
}

export function makeBracketRound(overrides: Partial<BracketRound> = {}): BracketRound {
  return {
    stage: 'ROUND_OF_32',
    label: 'Round of 32',
    matches: [],
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const ALL_BRACKET_STAGES = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
] as const;

export const ALL_GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const;
