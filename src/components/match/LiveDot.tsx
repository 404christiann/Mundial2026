export function LiveDot() {
  return (
    <span
      data-testid="live-dot"
      role="status"
      aria-label="Live"
      className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-1.5 py-0.5 animate-pulse"
    >
      <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-white" />
    </span>
  );
}
