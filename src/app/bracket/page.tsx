import { TabShell } from '@/components/layout/TabShell';
import { BracketView } from '@/components/bracket/BracketView';
import { normalizeMatch } from '@/lib/football/endpoints';
import { detectStage } from '@/lib/stage';
import { getAllMatches } from '@/lib/football/endpoints';
import { buildBracket } from '@/lib/bracket';

export default async function BracketPage() {
  const raw = await getAllMatches().catch(() => ({ matches: [] }));
  const allMatches = raw.matches.map(normalizeMatch);
  const { stageLabel } = detectStage(allMatches);
  const rounds = buildBracket(allMatches);

  return (
    <TabShell stageLabel={stageLabel}>
      <div className="px-2 py-4">
        <p className="px-2 mb-3 font-display text-xs font-bold uppercase tracking-[0.22em] text-sky-200/55">
          Knockout path
        </p>
        <BracketView initialRounds={rounds} />
      </div>
    </TabShell>
  );
}
