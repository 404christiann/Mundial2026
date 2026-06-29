'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { BracketRound } from '@/types/domain';
import { POLL_INTERVAL_MS } from '@/lib/constants';

interface BracketResult {
  rounds: BracketRound[];
  isLive: boolean;
  isTracking: boolean;
}

export function useBracket(initial: BracketRound[]): BracketResult {
  const [rounds, setRounds] = useState<BracketRound[]>(initial);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLive = rounds.some(r => r.matches.some(m => m.isLive));
  const hasKnockoutMatches = rounds.some(r => r.matches.length > 0);
  const isComplete = hasKnockoutMatches
    && rounds.every(r => r.matches.every(m => m.status === 'FINISHED' || m.status === 'POSTPONED'));
  const isTracking = hasKnockoutMatches && !isComplete;

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
    if (!isTracking) {
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
  }, [isTracking, runFetch]);

  return { rounds, isLive, isTracking };
}
