export function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function formatTimeOnly(utcDate: string, tz?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: tz ?? 'UTC',
  }).format(new Date(utcDate));
}

export function formatDateOnly(utcDate: string, tz?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz ?? 'UTC',
  }).format(new Date(utcDate));
}

export function formatKickoff(utcDate: string, tz?: string): string {
  const zone = tz ?? 'UTC';
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: zone,
  }).format(new Date(utcDate));
  return date;
}

export function todayInTz(tz?: string): string {
  const zone = tz ?? getLocalTimeZone();
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: zone,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function matchIsOnLocalDate(utcDate: string, localDate: string, tz: string): boolean {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
  }).formatToParts(new Date(utcDate));
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}` === localDate;
}

export function addDays(date: string, n: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
