'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import type { Group } from '@/types/domain';
import { GroupCard } from './GroupCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StandingsTable } from './StandingsTable';
import { MatchCard } from '@/components/match/MatchCard';
import { EmptyState } from '@/components/ui/EmptyState';

const gridVariants = {
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function GroupsView({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState<Group | null>(null);

  if (groups.length === 0) return <EmptyState title="No group data yet" />;

  return (
    <>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
        variants={gridVariants}
        initial="hidden"
        animate="show"
      >
        {groups.map(g => (
          <motion.div key={g.id} variants={cardVariants}>
            <GroupCard group={g} onOpen={() => setActive(g)} />
          </motion.div>
        ))}
      </motion.div>
      <BottomSheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.label}
      >
        {active && (
          <div className="space-y-4">
            <StandingsTable standings={active.standings} />
            {active.matches.length > 0 && (
              <div className="space-y-2 mt-4">
                {active.matches.map(m => <MatchCard key={m.id} match={m} showDate />)}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
