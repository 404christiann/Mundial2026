import type { Group } from '@/types/domain';
import { StandingsTable } from './StandingsTable';

interface GroupCardProps {
  group: Group;
  onOpen?: () => void;
}

export function GroupCard({ group, onOpen }: GroupCardProps) {
  return (
    <div className="group-card rounded-[1.35rem] tournament-card overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="relative w-full text-left px-4 py-3 border-b border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h2 className="font-display text-xl font-bold tracking-tight text-white">{group.label}</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-200">
          Details
        </span>
      </button>
      <div className="relative px-4 py-3 overflow-x-auto">
        <StandingsTable standings={group.standings} />
      </div>
    </div>
  );
}
