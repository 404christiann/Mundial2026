'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="brand-shell flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sky-100/70">Something went wrong loading World Cup data.</p>
      <button
        onClick={reset}
        className="rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
