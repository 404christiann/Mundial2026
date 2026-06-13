import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/matches/route';
import { makeRawMatch } from '../fixtures';

function makeUpstreamResponse(matches: ReturnType<typeof makeRawMatch>[]) {
  return new Response(
    JSON.stringify({ matches, resultSet: { count: matches.length } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([]));
  process.env.FOOTBALL_DATA_API_TOKEN = 'test-token';
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.FOOTBALL_DATA_API_TOKEN;
});

describe('GET /api/matches — tz param behavior', () => {
  it('with ?date=2026-06-13&tz=America/Los_Angeles: upstream called with dateTo=2026-06-14', async () => {
    const req = new Request('http://localhost/api/matches?date=2026-06-13&tz=America/Los_Angeles');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('dateTo=2026-06-14'),
      expect.anything()
    );
  });

  it('without ?tz=: upstream called with dateTo=2026-06-13 (frozen behavior)', async () => {
    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('dateTo=2026-06-13'),
      expect.anything()
    );
    // Must NOT use dateTo=2026-06-14 when no tz
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).not.toContain('dateTo=2026-06-14');
  });

  it('filters matches by local date in tz — only June 12 local matches returned', async () => {
    // This match is June 12 at 6PM PST (June 13 01:00 UTC) — should be included for date=2026-06-12
    const matchOnJune12Local = makeRawMatch({ id: 1, utcDate: '2026-06-13T01:00:00Z' });
    // This match is June 13 at 11AM PST (June 13 18:00 UTC) — should be excluded
    const matchOnJune13Local = makeRawMatch({ id: 2, utcDate: '2026-06-13T18:00:00Z' });

    vi.spyOn(global, 'fetch').mockResolvedValue(
      makeUpstreamResponse([matchOnJune12Local, matchOnJune13Local])
    );

    const req = new Request('http://localhost/api/matches?date=2026-06-12&tz=America/Los_Angeles');
    const res = await GET(req);
    const body = await res.json();

    expect(body.matches).toHaveLength(1);
    expect(body.matches[0].id).toBe(1);
  });

  it('without tz: no filtering applied (returns all matches)', async () => {
    const match1 = makeRawMatch({ id: 1, utcDate: '2026-06-13T01:00:00Z' });
    const match2 = makeRawMatch({ id: 2, utcDate: '2026-06-13T18:00:00Z' });

    vi.spyOn(global, 'fetch').mockResolvedValue(
      makeUpstreamResponse([match1, match2])
    );

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);
    const body = await res.json();

    expect(body.matches).toHaveLength(2);
  });
});
