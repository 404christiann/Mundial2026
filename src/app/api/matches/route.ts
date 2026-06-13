import { NextResponse } from 'next/server';
import { FootballApiError } from '@/lib/football/client';
import { normalizeMatch } from '@/lib/football/endpoints';
import { withTtlCache, setRateLimitState } from '@/lib/football/cache';
import { MATCHES_TTL_MS } from '@/lib/constants';
import { addDays, matchIsOnLocalDate } from '@/lib/time';
import type { RawMatchesResponse } from '@/types/football';

const BASE_URL = 'https://api.football-data.org/v4';

async function fetchMatches(url: string): Promise<RawMatchesResponse> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN ?? '';
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });

  const avail = res.headers.get('X-RequestsAvailable');
  const reset = res.headers.get('X-RequestCounter-Reset');
  if (avail != null) {
    setRateLimitState(Number(avail), reset != null ? Number(reset) : 30);
  }

  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After');
    const err = new FootballApiError(res.status, `upstream ${res.status}`, retryAfter ? Number(retryAfter) : undefined);
    throw err;
  }

  return res.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const matchday = searchParams.get('matchday');
  const tz = searchParams.get('tz');

  if (!date && !matchday) {
    return NextResponse.json({ error: 'date or matchday required' }, { status: 400 });
  }

  // When tz present: query 2-day window and filter by local date
  // When tz absent: keep original dateTo=date (frozen test compatibility)
  const dateTo = date && tz ? addDays(date, 1) : date;

  const upstreamUrl = date
    ? `${BASE_URL}/competitions/WC/matches?dateFrom=${date}&dateTo=${dateTo}`
    : `${BASE_URL}/competitions/WC/matches?matchday=${matchday}`;

  const cacheKey = date
    ? `matches:date:${date}${tz ? `:${tz}` : ''}`
    : upstreamUrl;

  try {
    const raw = await withTtlCache<RawMatchesResponse>(cacheKey, MATCHES_TTL_MS, () => fetchMatches(upstreamUrl));
    let matches = raw.matches.map(normalizeMatch);
    if (date && tz) {
      matches = matches.filter(m => matchIsOnLocalDate(m.utcDate, date, tz));
    }
    return NextResponse.json({ matches });
  } catch (err) {
    if (err instanceof FootballApiError) {
      const headers: Record<string, string> = {};
      if (err.retryAfter != null) headers['Retry-After'] = String(err.retryAfter);
      return NextResponse.json({ error: err.message }, { status: err.status, headers });
    }
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
