'use client';
import { useRef, useEffect, useCallback } from 'react';
import { TOURNAMENT_START, TOURNAMENT_END } from '@/lib/constants';
import { daysInMonth, weekdayOfFirst } from '@/lib/time';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarGridProps {
  month: string;        // 'YYYY-MM'
  selectedDate: string; // 'YYYY-MM-DD'
  today: string;        // 'YYYY-MM-DD'
  onSelect: (date: string) => void;
}

export function CalendarGrid({ month, selectedDate, today, onSelect }: CalendarGridProps) {
  const [year, monthNum] = month.split('-').map(Number);
  const totalDays = daysInMonth(year, monthNum);
  const leadingBlanks = weekdayOfFirst(month);
  const gridRef = useRef<HTMLDivElement>(null);

  const days: Array<{ date: string; inRange: boolean }> = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${month}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, inRange: dateStr >= TOURNAMENT_START && dateStr <= TOURNAMENT_END });
  }

  // Which date holds the roving tab focus: selected if in this month, else first in-range
  const rovingDate =
    days.find(d => d.inRange && d.date === selectedDate)?.date ??
    days.find(d => d.inRange)?.date ??
    '';

  // Focus the roving target whenever the viewed month changes
  useEffect(() => {
    const target = gridRef.current?.querySelector('[tabindex="0"]') as HTMLButtonElement | null;
    target?.focus();
  }, [month]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      gridRef.current?.querySelectorAll('button') ?? []
    ) as HTMLButtonElement[];
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;

    let next: HTMLButtonElement | undefined;
    if (e.key === 'ArrowRight') next = buttons[idx + 1];
    else if (e.key === 'ArrowLeft') next = buttons[idx - 1];
    else if (e.key === 'ArrowDown') next = buttons[idx + 7];
    else if (e.key === 'ArrowUp') next = buttons[idx - 7];

    if (next) {
      e.preventDefault();
      next.focus();
    }
  }, []);

  return (
    <div ref={gridRef} onKeyDown={handleKeyDown} role="grid" aria-label={`Calendar for ${month}`}>
      <div className="grid grid-cols-7 mb-1" role="row">
        {WEEKDAYS.map(w => (
          <div key={w} role="columnheader" className="text-center text-[0.7rem] font-semibold text-slate-500 py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} role="gridcell" className="h-10" />
        ))}
        {days.map(({ date, inRange }) => {
          const isSelected = date === selectedDate;
          const isTodayDate = date === today;
          const dayNum = parseInt(date.split('-')[2], 10);
          const fullLabel = new Intl.DateTimeFormat('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }).format(new Date(`${date}T12:00:00`));

          return (
            <div key={date} role="gridcell" className="flex items-center justify-center h-10">
              {inRange ? (
                <button
                  type="button"
                  onClick={() => onSelect(date)}
                  aria-label={fullLabel}
                  aria-current={isSelected ? 'date' : undefined}
                  tabIndex={date === rovingDate ? 0 : -1}
                  className={[
                    'h-10 w-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300/70',
                    isSelected
                      ? 'brand-chip text-white'
                      : isTodayDate
                      ? 'ring-1 ring-cyan-300/70 text-slate-200 hover:bg-white/10'
                      : 'text-slate-300 hover:bg-white/10',
                  ].join(' ')}
                >
                  {dayNum}
                </button>
              ) : (
                <span className="h-10 w-10 flex items-center justify-center text-sm text-slate-700 select-none">
                  {dayNum}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
