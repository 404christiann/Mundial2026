import { redirect } from 'next/navigation';
import { getAllMatches } from '@/lib/football/endpoints';
import { normalizeMatch } from '@/lib/football/endpoints';
import { detectStage } from '@/lib/stage';

export default async function HomePage() {
  try {
    const raw = await getAllMatches();
    const matches = raw.matches.map(normalizeMatch);
    const { defaultTab } = detectStage(matches);
    redirect(`/${defaultTab}`);
  } catch {
    redirect('/schedule');
  }
}
