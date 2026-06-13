import type { Match, Standing, Group, GroupId } from '@/types/domain';
import type { RawStanding } from '@/types/football';
import { normalizeTeam } from './football/endpoints';
import { GROUP_ORDER } from './constants';

export function sortStanding(rows: Standing[]): Standing[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });
}

export function markQualifiers(rows: Standing[]): Standing[] {
  return rows.map((row, i) => ({ ...row, qualifying: i < 2 }));
}

export function matchesForGroup(matches: Match[], group: GroupId): Match[] {
  return matches
    .filter(m => m.stage === 'GROUP_STAGE' && m.group === group)
    .sort((a, b) => {
      if (a.matchday !== b.matchday) return (a.matchday ?? 0) - (b.matchday ?? 0);
      return a.utcDate.localeCompare(b.utcDate);
    });
}

export function buildGroups(standings: RawStanding[], matches: Match[]): Group[] {
  const groupMap = new Map<GroupId, Standing[]>();

  for (const standing of standings) {
    if (standing.type !== 'TOTAL') continue;
    const match = standing.group?.match(/([A-L])$/);
    if (!match) continue;
    const id = match[1] as GroupId;

    const rows: Standing[] = standing.table.map(row => ({
      position: row.position,
      team: normalizeTeam(row.team),
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
      qualifying: false,
    }));

    const sorted = sortStanding(rows);
    groupMap.set(id, markQualifiers(sorted));
  }

  return GROUP_ORDER
    .filter(id => groupMap.has(id))
    .map(id => ({
      id,
      label: `Group ${id}`,
      standings: groupMap.get(id)!,
      matches: matchesForGroup(matches, id),
    }));
}
