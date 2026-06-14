import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarGrid } from '@/components/schedule/CalendarGrid';

describe('CalendarGrid', () => {
  it('renders 30 day cells for June 2026', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    // 30 days total; 20 in-range (Jun 11-30) as buttons, 10 out-of-range as spans
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(20); // Jun 11–30
  });

  it('renders 31 day cells for July 2026', () => {
    render(
      <CalendarGrid month="2026-07" selectedDate="2026-07-10" today="2026-07-10" onSelect={vi.fn()} />
    );
    // 19 in-range (Jul 1-19) as buttons, 12 out-of-range as spans
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(19); // Jul 1–19
  });

  it('marks June 1–10 as disabled (rendered as spans, not buttons)', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    // Jun 1 should not be a button
    expect(screen.queryByRole('button', { name: /June 1,/ })).not.toBeInTheDocument();
    // Jun 11 should be a button
    expect(screen.getByRole('button', { name: /June 11,/ })).toBeInTheDocument();
  });

  it('marks July 20–31 as disabled (rendered as spans, not buttons)', () => {
    render(
      <CalendarGrid month="2026-07" selectedDate="2026-07-10" today="2026-07-10" onSelect={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /July 20,/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /July 19,/ })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked date', () => {
    const onSelect = vi.fn();
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole('button', { name: /June 20,/ }));
    expect(onSelect).toHaveBeenCalledWith('2026-06-20');
  });

  it('marks selected date with aria-current="date"', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    const selected = screen.getByRole('button', { name: /June 13,/ });
    expect(selected).toHaveAttribute('aria-current', 'date');
  });

  it('does not mark non-selected dates with aria-current', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    const other = screen.getByRole('button', { name: /June 14,/ });
    expect(other).not.toHaveAttribute('aria-current');
  });

  it('renders weekday header row', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    expect(screen.getByRole('columnheader', { name: 'Su' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Sa' })).toBeInTheDocument();
  });

  it('selected date has tabIndex 0; others have tabIndex -1', () => {
    render(
      <CalendarGrid month="2026-06" selectedDate="2026-06-15" today="2026-06-14" onSelect={vi.fn()} />
    );
    const selected = screen.getByRole('button', { name: /June 15,/ });
    expect(selected).toHaveAttribute('tabindex', '0');
    const other = screen.getByRole('button', { name: /June 20,/ });
    expect(other).toHaveAttribute('tabindex', '-1');
  });

  it('first in-range day gets tabIndex 0 when selected date is not in this month', () => {
    render(
      <CalendarGrid month="2026-07" selectedDate="2026-06-13" today="2026-06-14" onSelect={vi.fn()} />
    );
    // First in-range July date is Jul 1
    const first = screen.getByRole('button', { name: /July 1,/ });
    expect(first).toHaveAttribute('tabindex', '0');
  });
});
