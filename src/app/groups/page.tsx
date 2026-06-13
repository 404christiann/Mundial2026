import { TabShell } from '@/components/layout/TabShell';
import { GroupsView } from '@/components/groups/GroupsView';
import { normalizeMatch } from '@/lib/football/endpoints';
import { detectStage } from '@/lib/stage';
import { getAllMatches, getStandings } from '@/lib/football/endpoints';
import { buildGroups } from '@/lib/standings';

export default async function GroupsPage() {
  const [allRaw, standingsRaw] = await Promise.all([
    getAllMatches().catch(() => ({ matches: [] })),
    getStandings().catch(() => ({ standings: [] })),
  ]);

  const allMatches = allRaw.matches.map(normalizeMatch);
  const { stageLabel } = detectStage(allMatches);
  const groups = buildGroups(standingsRaw.standings, allMatches);

  return (
    <TabShell stageLabel={stageLabel}>
      <GroupsView groups={groups} />
    </TabShell>
  );
}
