import { NextResponse } from 'next/server';
import { FootballApiError } from '@/lib/football/client';
import { normalizeMatch } from '@/lib/football/endpoints';
import { withTtlCache } from '@/lib/football/cache';
import { buildBracket } from '@/lib/bracket';
import { MATCHES_TTL_MS, TOURNAMENT_START, TOURNAMENT_END } from '@/lib/constants';
import type { RawMatchesResponse } from '@/types/football';

const BASE_URL = 'https://api.football-data.org/v4';

async function fetchAllMatches(): Promise<RawMatchesResponse> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN ?? '';
  const res = await fetch(
    `${BASE_URL}/competitions/WC/matches?dateFrom=${TOURNAMENT_START}&dateTo=${TOURNAMENT_END}`,
    { headers: { 'X-Auth-Token': token } },
  );

  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After');
    throw new FootballApiError(res.status, `upstream ${res.status}`, retryAfter ? Number(retryAfter) : undefined);
  }

  return res.json();
}

export async function GET(_req: Request) {
  try {
    const raw = await withTtlCache<RawMatchesResponse>('bracket:all', MATCHES_TTL_MS, fetchAllMatches);
    const matches = raw.matches.map(normalizeMatch);
    const rounds = buildBracket(matches);
    return NextResponse.json({ rounds });
  } catch (err) {
    if (err instanceof FootballApiError) {
      const headers: Record<string, string> = {};
      if (err.retryAfter != null) headers['Retry-After'] = String(err.retryAfter);
      return NextResponse.json({ error: err.message }, { status: err.status, headers });
    }
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
