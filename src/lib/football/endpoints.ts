import { fetchFootball } from './client';
import { withTtlCache } from './cache';
import { MATCHES_TTL_MS, STANDINGS_TTL_MS } from '@/lib/constants';
import type { RawStatus, RawTeam, RawMatch, RawMatchesResponse, RawStandingsResponse } from '@/types/football';
import type { MatchStatus, Team, Match, GroupId } from '@/types/domain';

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
    stage: raw.stage,
    matchday: raw.matchday,
    group: parseGroupId(raw.group),
    venue: normalizeVenue(raw.venue),
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
    fetchFootball<RawMatchesResponse>('/competitions/WC/matches', { revalidate: 60 })
  );
}

export async function getStandings(): Promise<RawStandingsResponse> {
  return withTtlCache('standings', STANDINGS_TTL_MS, () =>
    fetchFootball<RawStandingsResponse>('/competitions/WC/standings', { revalidate: 300 })
  );
}
