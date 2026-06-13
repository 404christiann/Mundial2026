'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { BracketRound } from '@/types/domain';
import { POLL_INTERVAL_MS } from '@/lib/constants';

interface BracketResult {
  rounds: BracketRound[];
  isLive: boolean;
}

export function useBracket(initial: BracketRound[]): BracketResult {
  const [rounds, setRounds] = useState<BracketRound[]>(initial);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLive = rounds.some(r => r.matches.some(m => m.isLive));

  const runFetch = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const res = await fetch('/api/bracket');
      const body = await res.json();
      if (mountedRef.current) setRounds(body.rounds as BracketRound[]);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isLive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    runFetch();
    intervalRef.current = setInterval(runFetch, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLive, runFetch]);

  return { rounds, isLive };
}
