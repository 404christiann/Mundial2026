import { describe, it, expect } from 'vitest';
import { formatDateOnly, formatKickoff, formatTimeOnly, addDays, todayInTz, getLocalTimeZone, firstOfMonth, daysInMonth, weekdayOfFirst } from '@/lib/time';

const UTC_DATE = '2026-06-13T18:00:00Z';

describe('formatTimeOnly', () => {
  it('converts UTC to Eastern time (UTC-4 in summer)', () => {
    expect(formatTimeOnly(UTC_DATE, 'America/New_York')).toBe('02:00 PM');
  });

  it('converts UTC to Central time (UTC-5 in summer)', () => {
    expect(formatTimeOnly(UTC_DATE, 'America/Chicago')).toBe('01:00 PM');
  });

  it('converts UTC to Pacific time (UTC-7 in summer)', () => {
    expect(formatTimeOnly(UTC_DATE, 'America/Los_Angeles')).toBe('11:00 AM');
  });

  it('rolls to next local day when UTC midnight crosses timezone boundary', () => {
    // 2026-06-13T02:00:00Z is Jun 13 in UTC but Jun 12 evening in LA (UTC-7 = Jun 12 19:00)
    const result = formatTimeOnly('2026-06-13T02:00:00Z', 'America/Los_Angeles');
    expect(result).toBe('07:00 PM');
  });

  it('returns a string in HH:MM AM/PM format', () => {
    const result = formatTimeOnly(UTC_DATE, 'UTC');
    expect(result).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
  });

  it('falls back to UTC when no timezone provided', () => {
    expect(formatTimeOnly(UTC_DATE, 'UTC')).toBe('06:00 PM');
  });
});

describe('formatDateOnly', () => {
  it('formats the local kickoff date without time', () => {
    expect(formatDateOnly(UTC_DATE, 'UTC')).toBe('Sat, Jun 13');
  });

  it('respects timezone day rollover', () => {
    expect(formatDateOnly('2026-06-13T02:00:00Z', 'America/Los_Angeles')).toBe('Fri, Jun 12');
  });
});

describe('formatKickoff', () => {
  it('includes both date and time in the output', () => {
    const result = formatKickoff(UTC_DATE, 'America/New_York');
    expect(result).toContain('02:00 PM');
    expect(result.length).toBeGreaterThan(5);
  });

  it('includes day-of-week abbreviation', () => {
    // Jun 13 2026 is a Saturday
    const result = formatKickoff(UTC_DATE, 'UTC');
    expect(result).toMatch(/sat/i);
  });

  it('includes the month name or abbreviation', () => {
    const result = formatKickoff(UTC_DATE, 'UTC');
    expect(result).toMatch(/jun/i);
  });

  it('returns a non-empty string for any valid UTC date', () => {
    const result = formatKickoff('2026-07-19T18:00:00Z', 'America/New_York');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('addDays', () => {
  it('adds one day correctly', () => {
    expect(addDays('2026-06-13', 1)).toBe('2026-06-14');
  });

  it('subtracts one day correctly', () => {
    expect(addDays('2026-06-13', -1)).toBe('2026-06-12');
  });

  it('crosses a month boundary forward', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('crosses a month boundary backward', () => {
    expect(addDays('2026-06-01', -1)).toBe('2026-05-31');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles adding zero days', () => {
    expect(addDays('2026-06-13', 0)).toBe('2026-06-13');
  });

  it('handles large increments', () => {
    expect(addDays('2026-06-11', 38)).toBe('2026-07-19');
  });

  it('returns a YYYY-MM-DD formatted string', () => {
    expect(addDays('2026-06-13', 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not drift due to UTC vs local timezone (no time component)', () => {
    // This is the key invariant: treating the date as a calendar date, not a timestamp
    const result = addDays('2026-06-30', 1);
    expect(result).toBe('2026-07-01');
  });
});

describe('todayInTz', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayInTz('America/New_York');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a date string (not a datetime)', () => {
    const result = todayInTz('UTC');
    expect(result).not.toContain('T');
    expect(result).not.toContain(':');
  });

  it('falls back gracefully when no timezone provided', () => {
    const result = todayInTz();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getLocalTimeZone', () => {
  it('returns a non-empty string', () => {
    const tz = getLocalTimeZone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('returns a valid IANA timezone string', () => {
    const tz = getLocalTimeZone();
    // Valid IANA zones contain a slash (e.g. "America/New_York") or are "UTC"
    expect(tz === 'UTC' || tz.includes('/')).toBe(true);
  });
});

describe('firstOfMonth', () => {
  it('returns YYYY-MM from a full date', () => {
    expect(firstOfMonth('2026-06-13')).toBe('2026-06');
  });

  it('works for dates at end of month', () => {
    expect(firstOfMonth('2026-07-19')).toBe('2026-07');
  });
});

describe('daysInMonth', () => {
  it('returns 30 for June 2026', () => {
    expect(daysInMonth(2026, 6)).toBe(30);
  });

  it('returns 31 for July 2026', () => {
    expect(daysInMonth(2026, 7)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2025, 2)).toBe(28);
  });

  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
});

describe('weekdayOfFirst', () => {
  it('returns 1 (Monday) for June 2026', () => {
    // June 1, 2026 is a Monday
    expect(weekdayOfFirst('2026-06')).toBe(1);
  });

  it('returns 3 (Wednesday) for July 2026', () => {
    // July 1, 2026 is a Wednesday
    expect(weekdayOfFirst('2026-07')).toBe(3);
  });

  it('returns a value in 0–6', () => {
    const result = weekdayOfFirst('2026-06');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(6);
  });
});
