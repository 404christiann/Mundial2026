'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, todayInTz } from '@/lib/time';
import { TOURNAMENT_START, TOURNAMENT_END } from '@/lib/constants';

interface DatePagerProps {
  date: string;
  tz?: string;
}

export function DatePager({ date, tz }: DatePagerProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [dir, setDir] = useState(1);

  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  const atStart = date <= TOURNAMENT_START;
  const atEnd   = date >= TOURNAMENT_END;

  const today = todayInTz(tz);
  const isToday = date === today;
  const label = isToday
    ? 'Today'
    : new Intl.DateTimeFormat('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      }).format(new Date(`${date}T12:00:00`));

  const buildUrl = (d: string) => tz ? `/schedule?date=${d}&tz=${tz}` : `/schedule?date=${d}`;
  const go = (d: string, direction: number) => {
    setDir(direction);
    router.push(buildUrl(d));
  };

  return (
    <div className="mx-4 my-3 flex items-center justify-between rounded-full border border-white/15 bg-black/45 px-2 py-1.5 shadow-[0_12px_38px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <button
        onClick={() => go(prev, -1)}
        disabled={atStart}
        aria-label="Previous day"
        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative h-6 overflow-hidden flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.span
            key={date}
            custom={dir}
            initial={reduce ? false : { x: dir * 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? {} : { x: dir * -20, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute font-display text-base font-bold tracking-wide brand-accent-text"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        onClick={() => go(next, 1)}
        disabled={atEnd}
        aria-label="Next day"
        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
