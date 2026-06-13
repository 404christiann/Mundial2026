import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabBar } from '@/components/layout/TabBar';

const mockGetParam = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/schedule',
  useSearchParams: () => ({
    get: mockGetParam,
  }),
}));

beforeEach(() => {
  mockGetParam.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TabBar — tz param in tab links', () => {
  it('includes ?tz=America/New_York in all tab links when tz param is present', () => {
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'tz') return 'America/New_York';
      return null;
    });

    render(<TabBar />);

    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    for (const link of links) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toContain('?tz=');
      expect(href).toContain('America');
      expect(href).toContain('New_York');
    }
  });

  it('tab links are bare (no tz suffix) when no tz param', () => {
    mockGetParam.mockImplementation(() => null);

    render(<TabBar />);

    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/schedule');
    expect(hrefs).toContain('/groups');
    expect(hrefs).toContain('/bracket');
    for (const href of hrefs) {
      expect(href).not.toContain('?tz=');
    }
  });

  it('active highlight: pathname=/schedule marks schedule link active regardless of tz param', () => {
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'tz') return 'America/New_York';
      return null;
    });

    render(<TabBar />);

    // The schedule link should have the active class from the branded tab treatment.
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    const scheduleLink = links.find(l => l.textContent?.includes('Schedule'));
    expect(scheduleLink).toBeDefined();
    expect(scheduleLink!.className).toContain('text-white');
    expect(scheduleLink!.className).toContain('shadow-[0_10px_30px_rgba(238,20,8,0.16)]');

    // Other links should not be active
    const groupsLink = links.find(l => l.textContent?.includes('Groups'));
    expect(groupsLink!.className).toContain('text-slate-500');
  });
});
