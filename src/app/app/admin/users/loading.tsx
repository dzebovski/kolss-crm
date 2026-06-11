export default function AdminUsersLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-[var(--border)]" />
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-[var(--border)] px-4 py-4 last:border-0"
          >
            <div className="h-4 w-full max-w-md rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
