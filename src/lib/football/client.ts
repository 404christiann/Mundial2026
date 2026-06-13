import { setRateLimitState } from './cache';

const BASE_URL = 'https://api.football-data.org/v4';

export class FootballApiError extends Error {
  status: number;
  retryAfter?: number;
  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function fetchFootball<T>(
  path: string,
  init?: { revalidate?: number }
): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': token ?? '' },
    next: init?.revalidate != null ? { revalidate: init.revalidate } : undefined,
  } as RequestInit);

  const avail = res.headers.get('X-RequestsAvailable');
  const reset = res.headers.get('X-RequestCounter-Reset');
  if (avail != null) {
    setRateLimitState(Number(avail), reset != null ? Number(reset) : 30);
  }

  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After');
    throw new FootballApiError(
      res.status,
      `football-data.org error ${res.status}`,
      retryAfter ? Number(retryAfter) : undefined
    );
  }

  return res.json() as Promise<T>;
}
