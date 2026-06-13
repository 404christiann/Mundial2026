import { NextResponse } from 'next/server';
import { FootballApiError } from '@/lib/football/client';
import { normalizeMatch } from '@/lib/football/endpoints';
import { withTtlCache } from '@/lib/football/cache';
import { buildGroups } from '@/lib/standings';
import { STANDINGS_TTL_MS } from '@/lib/constants';
import type { RawStandingsResponse, RawMatchesResponse } from '@/types/football';

const BASE_URL = 'https://api.football-data.org/v4';

async function fetchFromApi<T>(path: string): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN ?? '';
  const res = await fetch(`${BASE_URL}${path}`, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After');
    throw new FootballApiError(res.status, `upstream ${res.status}`, retryAfter ? Number(retryAfter) : undefined);
  }
  return res.json();
}

export async function GET() {
  try {
    const [rawStandings, rawMatches] = await Promise.all([
      withTtlCache<RawStandingsResponse>('standings', STANDINGS_TTL_MS, () =>
        fetchFromApi<RawStandingsResponse>('/competitions/WC/standings')
      ),
      withTtlCache<RawMatchesResponse>('standings:matches', STANDINGS_TTL_MS, () =>
        fetchFromApi<RawMatchesResponse>('/competitions/WC/matches')
      ),
    ]);

    const matches = rawMatches.matches.map(normalizeMatch);
    const groups = buildGroups(rawStandings.standings, matches);
    return NextResponse.json({ groups });
  } catch (err) {
    if (err instanceof FootballApiError) {
      const headers: Record<string, string> = {};
      if (err.retryAfter != null) headers['Retry-After'] = String(err.retryAfter);
      return NextResponse.json({ error: err.message }, { status: err.status, headers });
    }
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
