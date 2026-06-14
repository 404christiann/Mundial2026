import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DatePager } from '@/components/schedule/DatePager';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/schedule',
}));

beforeEach(() => {
  mockPush.mockReset();
});

describe('Calendar — open and navigate', () => {
  it('calendar sheet is hidden on initial render', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens calendar sheet when the date label button is clicked', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows "Jump to date" title in the calendar sheet', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByText('Jump to date')).toBeInTheDocument();
  });

  it('opens on the selected month (June for a June date)', () => {
    render(<DatePager date="2026-06-20" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('navigates to next month (July) when Next month is clicked', () => {
    render(<DatePager date="2026-06-20" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();
  });

  it('disables Previous month when already at June', () => {
    render(<DatePager date="2026-06-20" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('disables Next month when at July', () => {
    render(<DatePager date="2026-07-10" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('selecting a date calls router.push with the correct URL (with tz)', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: /June 20,/ }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-20&tz=America/New_York');
  });

  it('selecting a date closes the calendar', async () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.click(screen.getByRole('button', { name: /June 20,/ }));
    // AnimatePresence holds the dialog during the exit animation; flush with act
    await act(async () => {});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('existing prev/next arrow buttons still work after calendar is added', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-13&tz=America/New_York');
  });
});
