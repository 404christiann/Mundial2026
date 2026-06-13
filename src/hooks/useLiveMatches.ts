'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Match } from '@/types/domain';
import { POLL_INTERVAL_MS } from '@/lib/constants';

interface LiveMatchesResult {
  matches: Match[];
  isLive: boolean;
  lastUpdated: number | null;
}

export function useLiveMatches(date: string, initial: Match[], tz?: string): LiveMatchesResult {
  const [matches, setMatches] = useState<Match[]>(initial);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLive = matches.some(m => m.isLive);

  const runFetch = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const url = tz ? `/api/matches?date=${date}&tz=${tz}` : `/api/matches?date=${date}`;
      const res = await fetch(url);
      const body = await res.json();
      if (mountedRef.current) {
        setMatches(body.matches as Match[]);
        setLastUpdated(Date.now());
      }
    } catch {
      // silent
    }
  }, [date, tz]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset to server-fetched data when date changes (navigation via DatePager)
  useEffect(() => {
    setMatches(initial);
    setLastUpdated(null);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return { matches, isLive, lastUpdated };
}
