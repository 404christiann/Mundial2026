import type { Team } from '@/types/domain';
import { ScoreValue } from './ScoreValue';
import { TeamFlag } from '@/components/ui/TeamFlag';

interface TeamRowProps {
  team: Team | null;
  score: number | null;
  isWinner?: boolean;
}

export function TeamRow({ team, score, isWinner }: TeamRowProps) {
  const displayTeam = team ?? { id: null, name: 'TBD', tla: '', crest: null };

  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="flex items-center gap-2 min-w-0">
        <TeamFlag team={displayTeam} size={20} />
        <span className={`truncate text-sm ${isWinner ? 'font-bold text-yellow-200' : 'text-slate-100'}`}>
          {displayTeam.name}
        </span>
      </div>
      <ScoreValue value={score} />
    </div>
  );
}
