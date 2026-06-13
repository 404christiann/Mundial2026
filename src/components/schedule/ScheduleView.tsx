'use client';
import type { Match } from '@/types/domain';
import { DatePager } from './DatePager';
import { MatchList } from './MatchList';
import { useLiveMatches } from '@/hooks/useLiveMatches';

interface ScheduleViewProps {
  date: string;
  initialMatches: Match[];
  tz?: string;
}

export function ScheduleView({ date, initialMatches, tz }: ScheduleViewProps) {
  const { matches } = useLiveMatches(date, initialMatches, tz);
  return (
    <div>
      <DatePager date={date} tz={tz} />
      <MatchList matches={matches} />
    </div>
  );
}
