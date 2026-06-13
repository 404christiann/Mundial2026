import type { Team } from '@/types/domain';

interface TeamFlagProps {
  team: Team | null;
  size?: number;
}

export function TeamFlag({ team, size = 20 }: TeamFlagProps) {
  return (
    <span data-testid="team-flag" className="inline-flex items-center justify-center">
      {team?.crest ? (
        <img src={team.crest} alt={team.name} width={size} height={size} />
      ) : (
        <span
          style={{ width: size, height: size }}
          className="inline-block rounded-md border border-white/10 bg-gradient-to-br from-blue-500/70 via-cyan-300/60 to-lime-300/70"
        />
      )}
    </span>
  );
}
