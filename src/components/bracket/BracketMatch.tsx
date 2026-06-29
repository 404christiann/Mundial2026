import type { Match } from '@/types/domain';
import { LiveDot } from '@/components/match/LiveDot';
import { TeamRow } from '@/components/match/TeamRow';

interface BracketMatchProps {
  match: Match | null;
}

export function BracketMatch({ match }: BracketMatchProps) {
  if (!match) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-300/25 bg-white/[0.03] p-2 text-sm space-y-1">
        <TeamRow team={null} score={null} />
        <TeamRow team={null} score={null} />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-2 text-sm space-y-1 ${
      match.isLive
        ? 'tournament-card ring-2 ring-red-500/70 shadow-[0_0_22px_rgba(238,20,8,0.26)]'
        : 'tournament-card'
    }`}>
      {match.isLive && <LiveDot />}
      <TeamRow team={match.homeTeam} score={match.fullTime.home} isWinner={match.winner === 'HOME'} />
      <TeamRow team={match.awayTeam} score={match.fullTime.away} isWinner={match.winner === 'AWAY'} />
    </div>
  );
}
