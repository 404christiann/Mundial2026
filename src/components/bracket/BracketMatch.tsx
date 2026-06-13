import type { Match } from '@/types/domain';
import { LiveDot } from '@/components/match/LiveDot';

interface BracketMatchProps {
  match: Match | null;
}

export function BracketMatch({ match }: BracketMatchProps) {
  if (!match) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-300/25 bg-white/[0.03] p-2 text-sm space-y-1.5">
        <div className="text-slate-600">TBD</div>
        <div className="text-slate-600">TBD</div>
      </div>
    );
  }

  const homeWon = match.winner === 'HOME';
  const awayWon = match.winner === 'AWAY';

  return (
    <div className={`rounded-2xl p-2 text-sm space-y-1.5 ${
      match.isLive
        ? 'tournament-card ring-2 ring-red-500/70 shadow-[0_0_22px_rgba(238,20,8,0.26)]'
        : 'tournament-card'
    }`}>
      {match.isLive && <LiveDot />}
      <div className="flex justify-between items-center gap-2">
        <span className={homeWon ? 'font-bold winner text-yellow-200' : 'text-slate-100'}>
          {match.homeTeam.name}
        </span>
        {match.fullTime.home !== null && (
          <span className="font-display font-bold tabular-nums">{match.fullTime.home}</span>
        )}
      </div>
      <div className="flex justify-between items-center gap-2">
        <span className={awayWon ? 'font-bold winner text-yellow-200' : 'text-slate-100'}>
          {match.awayTeam.name}
        </span>
        {match.fullTime.away !== null && (
          <span className="font-display font-bold tabular-nums">{match.fullTime.away}</span>
        )}
      </div>
    </div>
  );
}
