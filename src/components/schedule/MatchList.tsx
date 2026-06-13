'use client';
import type { Match } from '@/types/domain';
import { motion } from 'motion/react';
import { MatchCard } from '@/components/match/MatchCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { STAGE_LABELS } from '@/lib/constants';

const listVariants = {
  show: { transition: { staggerChildren: 0.05 } },
};

function groupMatches(matches: Match[]) {
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const key = match.group ? `Group ${match.group}` : STAGE_LABELS[match.stage];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(match);
  }
  return groups;
}

export function MatchList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <EmptyState title="No matches today" hint="Check another date" />;
  }

  const groups = groupMatches(matches);

  return (
    <div className="divide-y divide-white/10">
      {[...groups.entries()].map(([label, groupMatches]) => {
        const sorted = [...groupMatches].sort((a, b) => Number(b.isLive) - Number(a.isLive));
        return (
          <section key={label} className="py-2">
            <h2 className="px-4 py-2 font-display text-xs font-bold text-sky-200/70 uppercase tracking-[0.24em]">
              {label}
            </h2>
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-2 px-4"
            >
              {sorted.map(m => <MatchCard key={m.id} match={m} />)}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}
