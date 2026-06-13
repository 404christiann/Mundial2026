import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { TimezoneDetector } from '@/components/schedule/TimezoneDetector';

const mockReplace = vi.fn();
const mockGetParam = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => ({
    get: mockGetParam,
    toString: () => mockGetParam('__toString__') ?? '',
  }),
}));

vi.mock('@/lib/time', () => ({
  getLocalTimeZone: vi.fn(() => 'America/New_York'),
}));

beforeEach(() => {
  mockReplace.mockReset();
  mockGetParam.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TimezoneDetector', () => {
  it('calls router.replace with new tz when detected tz differs from URL tz', () => {
    // URL has tz=America/Los_Angeles
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'tz') return 'America/Los_Angeles';
      if (key === '__toString__') return 'tz=America%2FLos_Angeles';
      return null;
    });

    render(<TimezoneDetector />);

    expect(mockReplace).toHaveBeenCalledOnce();
    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain('tz=America%2FNew_York');
    expect(calledUrl).toContain('/schedule?');
  });

  it('does NOT call router.replace when detected tz matches URL tz', () => {
    // URL already has tz=America/New_York
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'tz') return 'America/New_York';
      return null;
    });

    render(<TimezoneDetector />);

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
