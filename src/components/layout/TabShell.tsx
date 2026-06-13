import { StageBanner } from './StageBanner';
import { TabBar } from './TabBar';

interface TabShellProps {
  stageLabel: string;
  children: React.ReactNode;
}

export function TabShell({ stageLabel, children }: TabShellProps) {
  return (
    <div className="brand-shell flex flex-col min-h-dvh max-w-2xl mx-auto border-x border-white/10 shadow-[0_0_90px_rgba(0,0,0,0.42)]">
      <header className="brand-header sticky top-0 z-40 backdrop-blur-xl border-b">
        <StageBanner label={stageLabel} />
        <div className="hidden md:block">
          <TabBar />
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <div className="md:hidden">
        <TabBar />
      </div>
    </div>
  );
}
