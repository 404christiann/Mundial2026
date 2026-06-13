import { describe, it, expect } from 'vitest';
import { normalizeStatus, normalizeTeam, normalizeMatch, normalizeVenue, parseGroupId } from '@/lib/football/endpoints';
import { makeRawMatch, makeRawTeam } from '../fixtures';

describe('normalizeStatus', () => {
  it('maps TIMED → TIMED', () => {
    expect(normalizeStatus('TIMED')).toBe('TIMED');
  });

  it('maps IN_PLAY → IN_PLAY', () => {
    expect(normalizeStatus('IN_PLAY')).toBe('IN_PLAY');
  });

  it('maps PAUSED → IN_PLAY (match is still live)', () => {
    expect(normalizeStatus('PAUSED')).toBe('IN_PLAY');
  });

  it('maps FINISHED → FINISHED', () => {
    expect(normalizeStatus('FINISHED')).toBe('FINISHED');
  });

  it('maps POSTPONED → POSTPONED', () => {
    expect(normalizeStatus('POSTPONED')).toBe('POSTPONED');
  });

  it('maps SUSPENDED → POSTPONED', () => {
    expect(normalizeStatus('SUSPENDED')).toBe('POSTPONED');
  });

  it('maps CANCELLED → POSTPONED', () => {
    expect(normalizeStatus('CANCELLED')).toBe('POSTPONED');
  });
});

describe('normalizeTeam', () => {
  it('passes through a fully populated team', () => {
    const raw = makeRawTeam({ id: 769, name: 'Mexico', tla: 'MEX', crest: 'https://example.com/mex.svg' });
    const team = normalizeTeam(raw);
    expect(team.id).toBe(769);
    expect(team.name).toBe('Mexico');
    expect(team.tla).toBe('MEX');
    expect(team.crest).toBe('https://example.com/mex.svg');
  });

  it('replaces null name with "TBD"', () => {
    const raw = makeRawTeam({ name: null });
    expect(normalizeTeam(raw).name).toBe('TBD');
  });

  it('replaces null tla with empty string', () => {
    const raw = makeRawTeam({ tla: null });
    expect(normalizeTeam(raw).tla).toBe('');
  });

  it('preserves null crest (no fallback at normalization layer)', () => {
    const raw = makeRawTeam({ crest: null });
    expect(normalizeTeam(raw).crest).toBeNull();
  });

  it('preserves null id for TBD teams', () => {
    const raw = makeRawTeam({ id: null, name: null });
    expect(normalizeTeam(raw).id).toBeNull();
  });
});

describe('normalizeMatch', () => {
  it('sets isLive true when status is IN_PLAY', () => {
    const raw = makeRawMatch({ status: 'IN_PLAY' });
    expect(normalizeMatch(raw).isLive).toBe(true);
  });

  it('sets isLive true when status is PAUSED (still live)', () => {
    const raw = makeRawMatch({ status: 'PAUSED' });
    expect(normalizeMatch(raw).isLive).toBe(true);
  });

  it('sets isLive false when status is FINISHED', () => {
    const raw = makeRawMatch({ status: 'FINISHED' });
    expect(normalizeMatch(raw).isLive).toBe(false);
  });

  it('sets isLive false when status is TIMED', () => {
    const raw = makeRawMatch({ status: 'TIMED' });
    expect(normalizeMatch(raw).isLive).toBe(false);
  });

  it('maps score.winner HOME_TEAM → HOME', () => {
    const raw = makeRawMatch({ score: { winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: { home: 2, away: 0 }, halfTime: { home: 1, away: 0 } } });
    expect(normalizeMatch(raw).winner).toBe('HOME');
  });

  it('maps score.winner AWAY_TEAM → AWAY', () => {
    const raw = makeRawMatch({ score: { winner: 'AWAY_TEAM', duration: 'REGULAR', fullTime: { home: 0, away: 1 }, halfTime: { home: 0, away: 0 } } });
    expect(normalizeMatch(raw).winner).toBe('AWAY');
  });

  it('maps score.winner DRAW → DRAW', () => {
    const raw = makeRawMatch({ score: { winner: 'DRAW', duration: 'REGULAR', fullTime: { home: 1, away: 1 }, halfTime: { home: 0, away: 0 } } });
    expect(normalizeMatch(raw).winner).toBe('DRAW');
  });

  it('maps score.winner null → null', () => {
    const raw = makeRawMatch({ score: { winner: null, duration: 'REGULAR', fullTime: { home: null, away: null }, halfTime: { home: null, away: null } } });
    expect(normalizeMatch(raw).winner).toBeNull();
  });

  it('normalizes group "GROUP_A" → "A"', () => {
    const raw = makeRawMatch({ group: 'GROUP_A' });
    expect(normalizeMatch(raw).group).toBe('A');
  });

  it('normalizes group "GROUP_L" → "L"', () => {
    const raw = makeRawMatch({ group: 'GROUP_L' });
    expect(normalizeMatch(raw).group).toBe('L');
  });

  it('normalizes null group → null (knockout matches)', () => {
    const raw = makeRawMatch({ group: null, stage: 'ROUND_OF_32' });
    expect(normalizeMatch(raw).group).toBeNull();
  });

  it('passes through a non-empty venue', () => {
    const raw = makeRawMatch({ venue: 'MetLife Stadium' });
    expect(normalizeMatch(raw).venue).toBe('MetLife Stadium');
  });

  it('trims venue whitespace', () => {
    const raw = makeRawMatch({ venue: '  Estadio Azteca  ' });
    expect(normalizeMatch(raw).venue).toBe('Estadio Azteca');
  });

  it('normalizes blank venue strings to null', () => {
    const raw = makeRawMatch({ venue: '   ' });
    expect(normalizeMatch(raw).venue).toBeNull();
  });

  it('preserves null venue as null', () => {
    const raw = makeRawMatch({ venue: null });
    expect(normalizeMatch(raw).venue).toBeNull();
  });

  it('maps fullTime scores correctly', () => {
    const raw = makeRawMatch({ score: { winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: { home: 3, away: 1 }, halfTime: { home: 1, away: 0 } } });
    const match = normalizeMatch(raw);
    expect(match.fullTime).toEqual({ home: 3, away: 1 });
    expect(match.halfTime).toEqual({ home: 1, away: 0 });
  });

  it('preserves null scores for unplayed matches', () => {
    const raw = makeRawMatch({ status: 'TIMED' });
    const match = normalizeMatch(raw);
    expect(match.fullTime.home).toBeNull();
    expect(match.fullTime.away).toBeNull();
  });

  it('coerces null homeTeam name to TBD', () => {
    const raw = makeRawMatch({ homeTeam: makeRawTeam({ name: null }) });
    expect(normalizeMatch(raw).homeTeam.name).toBe('TBD');
  });

  it('preserves match id and utcDate', () => {
    const raw = makeRawMatch({ id: 537327, utcDate: '2026-06-11T19:00:00Z' });
    const match = normalizeMatch(raw);
    expect(match.id).toBe(537327);
    expect(match.utcDate).toBe('2026-06-11T19:00:00Z');
  });
});

describe('normalizeVenue', () => {
  it('returns trimmed venue text for non-empty input', () => {
    expect(normalizeVenue('  BC Place  ')).toBe('BC Place');
  });

  it('returns null for empty, blank, and null input', () => {
    expect(normalizeVenue('')).toBeNull();
    expect(normalizeVenue('   ')).toBeNull();
    expect(normalizeVenue(null)).toBeNull();
  });
});

describe('parseGroupId', () => {
  it('parses "GROUP_A" → "A"', () => {
    expect(parseGroupId('GROUP_A')).toBe('A');
  });

  it('parses "GROUP_L" → "L" (12th group in 48-team format)', () => {
    expect(parseGroupId('GROUP_L')).toBe('L');
  });

  it('returns null for null input', () => {
    expect(parseGroupId(null)).toBeNull();
  });

  it('returns null for unrecognized format', () => {
    expect(parseGroupId('UNKNOWN')).toBeNull();
  });
});
