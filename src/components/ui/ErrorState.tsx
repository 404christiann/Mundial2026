interface ErrorStateProps { message?: string; onRetry?: () => void; }

export function ErrorState({ message = 'Failed to load data.', onRetry }: ErrorStateProps) {
  return (
    <div className="mx-4 my-8 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-red-400/20 bg-red-950/20 py-14 px-6 text-center">
      <p className="text-sm text-red-100/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}
