import { fetchFootball } from './client';
import { withTtlCache } from './cache';
import { MATCHES_TTL_MS, STANDINGS_TTL_MS, TOURNAMENT_START, TOURNAMENT_END } from '@/lib/constants';
import { venueCity, fixtureVenue, matchVenue } from '@/lib/venues';
import type { RawStatus, RawTeam, RawMatch, RawMatchesResponse, RawStandingsResponse } from '@/types/football';
import type { MatchStatus, Team, Match, GroupId, Stage } from '@/types/domain';

function normalizeStage(raw: string): Stage {
  if (raw === 'LAST_32') return 'ROUND_OF_32';
  if (raw === 'LAST_16') return 'ROUND_OF_16';
  return raw as Stage;
}

export function normalizeStatus(raw: RawStatus): MatchStatus {
  if (raw === 'PAUSED') return 'IN_PLAY';
  if (raw === 'SUSPENDED' || raw === 'CANCELLED') return 'POSTPONED';
  if (raw === 'TIMED') return 'TIMED';
  if (raw === 'IN_PLAY') return 'IN_PLAY';
  if (raw === 'FINISHED') return 'FINISHED';
  if (raw === 'POSTPONED') return 'POSTPONED';
  return 'TIMED';
}

export function normalizeTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    name: raw.name ?? 'TBD',
    tla: raw.tla ?? '',
    crest: raw.crest,
  };
}

export function parseGroupId(raw: string | null): GroupId | null {
  if (!raw) return null;
  const match = raw.match(/^GROUP_([A-L])$/);
  if (!match) return null;
  return match[1] as GroupId;
}

export function normalizeVenue(raw: string | null): string | null {
  const venue = raw?.trim();
  return venue ? venue : null;
}

export function normalizeMatch(raw: RawMatch): Match {
  const status = normalizeStatus(raw.status);
  const isLive = status === 'IN_PLAY';

  let winner: 'HOME' | 'AWAY' | 'DRAW' | null = null;
  if (raw.score.winner === 'HOME_TEAM') winner = 'HOME';
  else if (raw.score.winner === 'AWAY_TEAM') winner = 'AWAY';
  else if (raw.score.winner === 'DRAW') winner = 'DRAW';

  return {
    id: raw.id,
    utcDate: raw.utcDate,
    status,
    isLive,
    stage: normalizeStage(raw.stage),
    matchday: raw.matchday,
    group: parseGroupId(raw.group),
    venue: normalizeVenue(raw.venue) ?? fixtureVenue(raw.homeTeam.name ?? '', raw.awayTeam.name ?? '')?.venue ?? matchVenue(raw.id)?.venue ?? null,
    city: venueCity(normalizeVenue(raw.venue)) ?? fixtureVenue(raw.homeTeam.name ?? '', raw.awayTeam.name ?? '')?.city ?? matchVenue(raw.id)?.city ?? null,
    homeTeam: normalizeTeam(raw.homeTeam),
    awayTeam: normalizeTeam(raw.awayTeam),
    fullTime: { home: raw.score.fullTime.home, away: raw.score.fullTime.away },
    halfTime: { home: raw.score.halfTime.home, away: raw.score.halfTime.away },
    winner,
  };
}

export async function getMatchesByDate(date: string, dateTo?: string): Promise<RawMatchesResponse> {
  return withTtlCache(`matches:date:${date}:${dateTo ?? date}`, MATCHES_TTL_MS, () =>
    fetchFootball<RawMatchesResponse>(
      `/competitions/WC/matches?dateFrom=${date}&dateTo=${dateTo ?? date}`,
      { revalidate: 60 }
    )
  );
}

export async function getMatchesByMatchday(matchday: number): Promise<RawMatchesResponse> {
  return withTtlCache(`matches:matchday:${matchday}`, MATCHES_TTL_MS, () =>
    fetchFootball<RawMatchesResponse>(
      `/competitions/WC/matches?matchday=${matchday}`,
      { revalidate: 60 }
    )
  );
}

export async function getAllMatches(): Promise<RawMatchesResponse> {
  return withTtlCache('matches:all', MATCHES_TTL_MS, () =>
    fetchFootball<RawMatchesResponse>(
      `/competitions/WC/matches?dateFrom=${TOURNAMENT_START}&dateTo=${TOURNAMENT_END}`,
      { revalidate: 60 }
    )
  );
}

export async function getStandings(): Promise<RawStandingsResponse> {
  return withTtlCache('standings', STANDINGS_TTL_MS, () =>
    fetchFootball<RawStandingsResponse>('/competitions/WC/standings', { revalidate: 300 })
  );
}
