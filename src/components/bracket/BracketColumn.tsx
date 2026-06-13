'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import type { BracketRound } from '@/types/domain';
import { BracketMatch } from './BracketMatch';

interface BracketColumnProps {
  round: BracketRound;
  index?: number;
}

export function BracketColumn({ round, index = 0 }: BracketColumnProps) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const hasIO = mounted && typeof IntersectionObserver !== 'undefined';
  const inView = useInView(ref, { once: true });
  const show = reduce || !mounted || !hasIO || inView;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col gap-2 min-w-[168px]"
      initial={false}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : 16 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <h3 className="font-display text-xs font-bold text-sky-200/70 uppercase tracking-[0.22em] text-center px-2 pb-1 border-b border-white/10">
        {round.label}
      </h3>
      {round.matches.length === 0 ? (
        <BracketMatch match={null} />
      ) : (
        <div className="flex flex-col gap-3">
          {round.matches.map(m => <BracketMatch key={m.id} match={m} />)}
        </div>
      )}
    </motion.div>
  );
}
