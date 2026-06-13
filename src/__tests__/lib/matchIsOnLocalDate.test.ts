import { describe, it, expect } from 'vitest';
import { matchIsOnLocalDate } from '@/lib/time';

describe('matchIsOnLocalDate', () => {
  it('2026-06-13T01:00:00Z, localDate 2026-06-12, tz America/Los_Angeles → true (6PM PST on June 12)', () => {
    expect(matchIsOnLocalDate('2026-06-13T01:00:00Z', '2026-06-12', 'America/Los_Angeles')).toBe(true);
  });

  it('2026-06-13T01:00:00Z, localDate 2026-06-13, tz UTC → true', () => {
    expect(matchIsOnLocalDate('2026-06-13T01:00:00Z', '2026-06-13', 'UTC')).toBe(true);
  });

  it('2026-06-13T18:00:00Z, localDate 2026-06-13, tz America/Los_Angeles → true', () => {
    expect(matchIsOnLocalDate('2026-06-13T18:00:00Z', '2026-06-13', 'America/Los_Angeles')).toBe(true);
  });

  it('2026-06-13T01:00:00Z, localDate 2026-06-13, tz America/Los_Angeles → false', () => {
    expect(matchIsOnLocalDate('2026-06-13T01:00:00Z', '2026-06-13', 'America/Los_Angeles')).toBe(false);
  });
});
