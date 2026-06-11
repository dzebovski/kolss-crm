export default function LeadsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-32 rounded bg-[var(--border)]" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-[var(--border)]" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-[var(--border)] px-4 py-4 last:border-0"
          >
            <div className="h-4 flex-1 rounded bg-[var(--border)]" />
            <div className="h-4 w-24 rounded bg-[var(--border)]" />
            <div className="h-4 w-32 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
