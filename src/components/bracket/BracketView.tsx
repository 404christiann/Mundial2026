'use client';
import type { BracketRound } from '@/types/domain';
import { useBracket } from '@/hooks/useBracket';
import { RadialBracketView } from './RadialBracketView';

interface BracketViewProps {
  initialRounds: BracketRound[];
}

export function BracketView({ initialRounds }: BracketViewProps) {
  const { rounds } = useBracket(initialRounds);

  return <RadialBracketView rounds={rounds} />;
}
