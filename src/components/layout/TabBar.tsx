'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, Trophy, GitBranch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/schedule', label: 'Schedule', Icon: CalendarDays },
  { href: '/groups',   label: 'Groups',   Icon: Trophy },
  { href: '/bracket',  label: 'Bracket',  Icon: GitBranch },
];

export function TabBar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const tz = params.get('tz');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl md:static md:border-t-0 md:border-b md:bg-transparent">
      <ul className="flex px-2 py-1 md:px-3">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          const tabHref = tz ? `${href}?tz=${tz}` : href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={tabHref}
                className={`relative flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl py-2.5 text-xs font-semibold transition-all
                  ${active ? 'text-white shadow-[0_10px_30px_rgba(238,20,8,0.16)]' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-red-600 via-blue-600 to-cyan-400 opacity-90"
                  />
                )}
                <Icon className="relative w-5 h-5" />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
