'use client';
import type { MatchStatus } from '@/types/domain';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { formatTimeOnly, getLocalTimeZone } from '@/lib/time';

interface MatchStatusBadgeProps {
  status: MatchStatus;
  utcDate: string;
}

const LABEL: Record<Exclude<MatchStatus, 'TIMED'>, string> = {
  IN_PLAY: 'LIVE',
  FINISHED: 'FT',
  POSTPONED: 'PP',
};

export function MatchStatusBadge({ status, utcDate }: MatchStatusBadgeProps) {
  const reduce = useReducedMotion();
  const label = status === 'TIMED'
    ? formatTimeOnly(utcDate, getLocalTimeZone())
    : LABEL[status];
  const sizeClass = status === 'TIMED' ? 'min-w-[5.75rem] px-3' : 'min-w-12 px-2';

  const colorClass =
    status === 'IN_PLAY' ? 'text-red-300' :
    status === 'FINISHED' ? 'text-slate-400' :
    status === 'POSTPONED' ? 'text-yellow-300' :
    'text-cyan-200';

  return (
    <span
      data-testid="match-status-badge"
      className={`relative inline-block h-6 overflow-hidden rounded-full bg-white/5 text-xs font-bold tabular-nums ${sizeClass} ${colorClass}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label}
          initial={reduce ? { opacity: 0 } : { y: 8, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap px-2"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
