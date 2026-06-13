import { Suspense } from 'react';
import { TabShell } from '@/components/layout/TabShell';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { TimezoneDetector } from '@/components/schedule/TimezoneDetector';
import { Skeleton } from '@/components/ui/Skeleton';
import { normalizeMatch } from '@/lib/football/endpoints';
import { detectStage } from '@/lib/stage';
import { getAllMatches, getMatchesByDate } from '@/lib/football/endpoints';
import { todayInTz, addDays, matchIsOnLocalDate } from '@/lib/time';

interface SchedulePageProps {
  searchParams: Promise<{ date?: string; tz?: string }>;
}

async function ScheduleContent({ date, tz }: { date: string; tz: string }) {
  const raw = await getMatchesByDate(date, addDays(date, 1)).catch(() => ({ matches: [] }));
  const matches = raw.matches
    .map(normalizeMatch)
    .filter(m => matchIsOnLocalDate(m.utcDate, date, tz));
  return <ScheduleView date={date} initialMatches={matches} tz={tz} />;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const tz = params.tz ?? 'America/Los_Angeles';
  const date = params.date ?? todayInTz(tz);

  const allRaw = await getAllMatches().catch(() => ({ matches: [] }));
  const allMatches = allRaw.matches.map(normalizeMatch);
  const { stageLabel } = detectStage(allMatches);

  return (
    <TabShell stageLabel={stageLabel}>
      <Suspense fallback={null}>
        <TimezoneDetector />
      </Suspense>
      <Suspense fallback={
        <div className="p-4 space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      }>
        <ScheduleContent date={date} tz={tz} />
      </Suspense>
    </TabShell>
  );
}
