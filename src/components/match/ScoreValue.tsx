'use client';
import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';

export function ScoreValue({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current && value !== null && ref.current) {
      try {
        animate(ref.current, { color: ['#efff32', '#ffffff'] }, { duration: 0.8 });
      } catch {
        // silent — motion may not animate in test env
      }
    }
    prev.current = value;
  }, [value]);

  if (value === null) return null;
  return (
    <span ref={ref} className="font-display text-2xl font-bold leading-none tabular-nums text-white">
      {value}
    </span>
  );
}
