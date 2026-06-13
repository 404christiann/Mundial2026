'use client';
import type { BracketRound } from '@/types/domain';
import { BracketColumn } from './BracketColumn';
import { BracketConnector } from './BracketConnector';
import { useBracket } from '@/hooks/useBracket';

interface BracketViewProps {
  initialRounds: BracketRound[];
}

export function BracketView({ initialRounds }: BracketViewProps) {
  const { rounds } = useBracket(initialRounds);
  const allEmpty = rounds.every(r => r.matches.length === 0);

  return (
    <div className="overflow-x-auto px-4 py-4">
      {allEmpty && (
        <p className="mx-auto mb-4 max-w-sm rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-sky-100/70">
          Bracket fills in after the group stage
        </p>
      )}
      <div className="relative flex gap-6 min-w-max rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
        <BracketConnector />
        {rounds.map((r, i) => <BracketColumn key={r.stage} round={r} index={i} />)}
      </div>
    </div>
  );
}
