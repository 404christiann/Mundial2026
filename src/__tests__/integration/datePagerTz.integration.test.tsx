import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePager } from '@/components/schedule/DatePager';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/schedule',
}));

beforeEach(() => {
  mockPush.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DatePager — tz prop threading', () => {
  it('prev/next URLs include &tz=America/New_York when tz is provided', () => {
    render(<DatePager date="2026-06-14" tz="America/New_York" />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-13&tz=America/New_York');

    mockPush.mockReset();

    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-15&tz=America/New_York');
  });

  it('prev/next URLs are exactly /schedule?date=YYYY-MM-DD when tz is not provided', () => {
    render(<DatePager date="2026-06-14" />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-13');

    mockPush.mockReset();

    fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(mockPush).toHaveBeenCalledWith('/schedule?date=2026-06-15');
  });
});
