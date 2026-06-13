import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/bracket/route';
import { makeRawMatch } from '../fixtures';

const ROUND_ORDER = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

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

describe('GET /api/bracket', () => {
  it('returns exactly 6 rounds in the correct order', async () => {
    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    const body = await res.json();

    expect(body.rounds).toHaveLength(6);
    expect(body.rounds.map((r: { stage: string }) => r.stage)).toEqual(ROUND_ORDER);
  });

  it('returns empty matches arrays when no knockout games exist yet', async () => {
    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    const body = await res.json();

    for (const round of body.rounds) {
      expect(round.matches).toEqual([]);
    }
  });

  it('places knockout matches in the correct round', async () => {
    const r32Match = makeRawMatch({ id: 1, stage: 'ROUND_OF_32', group: null, matchday: null });
    const qfMatch = makeRawMatch({ id: 2, stage: 'QUARTER_FINALS', group: null, matchday: null });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([r32Match, qfMatch]));

    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    const body = await res.json();

    const r32 = body.rounds.find((r: { stage: string }) => r.stage === 'ROUND_OF_32');
    const qf = body.rounds.find((r: { stage: string }) => r.stage === 'QUARTER_FINALS');

    expect(r32.matches).toHaveLength(1);
    expect(r32.matches[0].id).toBe(1);
    expect(qf.matches).toHaveLength(1);
    expect(qf.matches[0].id).toBe(2);
  });

  it('excludes group stage matches from response', async () => {
    const groupMatch = makeRawMatch({ id: 99, stage: 'GROUP_STAGE', group: 'GROUP_A' });
    vi.spyOn(global, 'fetch').mockResolvedValue(makeUpstreamResponse([groupMatch]));

    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    const body = await res.json();

    const allMatchIds = body.rounds.flatMap((r: { matches: { id: number }[] }) => r.matches.map(m => m.id));
    expect(allMatchIds).not.toContain(99);
  });

  it('uses X-Auth-Token header in upstream call', async () => {
    const req = new Request('http://localhost/api/bracket');
    await GET(req);
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Auth-Token': 'test-token' }),
      })
    );
  });

  it('forwards 429 and Retry-After when upstream rate-limits', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 429, headers: { 'Retry-After': '60' } })
    );

    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('returns 500 when upstream fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('connection refused'));

    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('each round has a non-empty label string', async () => {
    const req = new Request('http://localhost/api/bracket');
    const res = await GET(req);
    const body = await res.json();

    for (const round of body.rounds) {
      expect(typeof round.label).toBe('string');
      expect(round.label.length).toBeGreaterThan(0);
    }
  });
});
