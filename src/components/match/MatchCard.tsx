'use client';
import type { Match } from '@/types/domain';
import { motion } from 'motion/react';
import { TeamRow } from './TeamRow';
import { MatchStatusBadge } from './MatchStatusBadge';
import { LiveDot } from './LiveDot';
import { formatDateOnly, getLocalTimeZone } from '@/lib/time';

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  showDate?: boolean;
}

export function MatchCard({ match, compact = false, showDate = false }: MatchCardProps) {
  const live = match.isLive;
  const kickoffDate = showDate ? formatDateOnly(match.utcDate, getLocalTimeZone()) : null;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className={`rounded-[1.35rem] overflow-hidden ${
        live
          ? 'tournament-card ring-2 ring-red-500/70 shadow-[0_0_34px_rgba(238,20,8,0.34)]'
          : 'tournament-card'
      }`}
    >
      {live && (
        <div className="brand-chip px-3 py-1.5 flex items-center justify-between">
          <LiveDot />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">Live</span>
        </div>
      )}
      <div className={`${live ? 'bg-black/35' : ''} ${compact ? 'px-3 py-2' : 'px-4 py-3'} relative space-y-1`}>
        <div className="min-w-0 space-y-1">
          <TeamRow
            team={match.homeTeam}
            score={match.fullTime.home}
            isWinner={match.winner === 'HOME'}
          />
          <TeamRow
            team={match.awayTeam}
            score={match.fullTime.away}
            isWinner={match.winner === 'AWAY'}
          />
        </div>
        {match.venue && (
          <p className="pt-1 text-left text-[0.72rem] font-medium leading-tight text-sky-100/55" data-testid="match-venue">
            {match.venue}
          </p>
        )}
        <div className="pt-1 flex flex-col items-start gap-1">
          {kickoffDate && (
            <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.14em] text-sky-100/60">
              {kickoffDate}
            </span>
          )}
          <MatchStatusBadge status={match.status} utcDate={match.utcDate} />
        </div>
      </div>
    </motion.div>
  );
}
