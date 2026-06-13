interface EmptyStateProps { title: string; hint?: string; }

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="mx-4 my-8 flex flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.03] py-14 px-6 text-center">
      <div aria-hidden className="brand-chip mb-4 h-2 w-20 rounded-full" />
      <p className="font-display text-xl font-bold text-white">{title}</p>
      {hint && <p className="mt-1 text-sm text-sky-100/55">{hint}</p>}
    </div>
  );
}
