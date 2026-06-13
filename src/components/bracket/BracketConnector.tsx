export function BracketConnector() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="bc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
