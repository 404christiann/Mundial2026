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

describe('GET /api/matches', () => {
  it('calls upstream with dateFrom and dateTo when ?date= is provided', async () => {
    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('dateFrom=2026-06-13'),
      expect.anything()
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('dateTo=2026-06-13'),
      expect.anything()
    );
  });

  it('calls upstream with matchday when ?matchday= is provided', async () => {
    const req = new Request('http://localhost/api/matches?matchday=3');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('matchday=3'),
      expect.anything()
    );
  });

  it('uses X-Auth-Token header in upstream call', async () => {
    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Auth-Token': 'test-token' }),
      })
    );
  });

  it('returns normalized matches in response', async () => {
    const rawMatch = makeRawMatch({ id: 99, status: 'FINISHED', venue: 'MetLife Stadium' });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([rawMatch]));

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);
    const body = await res.json();

    expect(body.matches).toHaveLength(1);
    expect(body.matches[0].id).toBe(99);
    expect(body.matches[0].status).toBe('FINISHED');
    expect(body.matches[0].venue).toBe('MetLife Stadium');
  });

  it('returns null venue when upstream venue is blank', async () => {
    const rawMatch = makeRawMatch({ venue: '   ' });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([rawMatch]));

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);
    const body = await res.json();

    expect(body.matches[0].venue).toBeNull();
  });

  it('normalizes PAUSED → IN_PLAY in response', async () => {
    const rawMatch = makeRawMatch({ status: 'PAUSED' });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([rawMatch]));

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);
    const body = await res.json();

    expect(body.matches[0].status).toBe('IN_PLAY');
  });

  it('forwards 429 status and Retry-After header when upstream rate-limits', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Retry-After': '30' },
      })
    );

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('returns 500 and error message when upstream is unreachable', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    const req = new Request('http://localhost/api/matches?date=2026-06-13');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when neither date nor matchday is provided', async () => {
    const req = new Request('http://localhost/api/matches');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('only calls football-data.org once for concurrent requests (cache hit)', async () => {
    const rawMatch = makeRawMatch({ id: 1 });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([rawMatch]));

    const req1 = new Request('http://localhost/api/matches?date=2026-06-20');
    const req2 = new Request('http://localhost/api/matches?date=2026-06-20');

    await Promise.all([GET(req1), GET(req2)]);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
