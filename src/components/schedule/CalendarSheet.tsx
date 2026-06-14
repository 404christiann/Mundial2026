'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CalendarGrid } from './CalendarGrid';
import { firstOfMonth } from '@/lib/time';

const TOURNAMENT_MONTHS = ['2026-06', '2026-07'];

function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(year, m - 1, 1));
}

interface CalendarSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string; // 'YYYY-MM-DD'
  today: string;        // 'YYYY-MM-DD' in user's tz
  onSelect: (date: string) => void;
}

export function CalendarSheet({ open, onClose, selectedDate, today, onSelect }: CalendarSheetProps) {
  const [viewMonth, setViewMonth] = useState(() => firstOfMonth(selectedDate));

  // Snap back to the selected date's month each time the sheet opens
  useEffect(() => {
    if (open) setViewMonth(firstOfMonth(selectedDate));
  }, [open, selectedDate]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const monthIdx = TOURNAMENT_MONTHS.indexOf(viewMonth);
  const canPrev = monthIdx > 0;
  const canNext = monthIdx < TOURNAMENT_MONTHS.length - 1;

  const handleSelect = useCallback((date: string) => {
    onSelect(date);
    onClose();
  }, [onSelect, onClose]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Jump to date">
      <div className="pb-2">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setViewMonth(TOURNAMENT_MONTHS[monthIdx - 1])}
            disabled={!canPrev}
            aria-label="Previous month"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-base font-bold text-white">
            {monthLabel(viewMonth)}
          </span>
          <button
            type="button"
            onClick={() => setViewMonth(TOURNAMENT_MONTHS[monthIdx + 1])}
            disabled={!canNext}
            aria-label="Next month"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <CalendarGrid
          month={viewMonth}
          selectedDate={selectedDate}
          today={today}
          onSelect={handleSelect}
        />
      </div>
    </BottomSheet>
  );
}
