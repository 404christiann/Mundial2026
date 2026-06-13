'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface PollingResult<T> {
  data: T | undefined;
  error: Error | null;
  isFetching: boolean;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  opts: { intervalMs: number; enabled: boolean }
): PollingResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const pausedRef = useRef(false);

  const runFetch = useCallback(async () => {
    if (pausedRef.current) return;
    setIsFetching(true);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setIsFetching(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      pausedRef.current = hidden;
      if (!hidden && opts.enabled) runFetch();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [opts.enabled, runFetch]);

  useEffect(() => {
    if (!opts.enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    runFetch();
    intervalRef.current = setInterval(runFetch, opts.intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [opts.enabled, opts.intervalMs, runFetch]);

  return { data, error, isFetching };
}
