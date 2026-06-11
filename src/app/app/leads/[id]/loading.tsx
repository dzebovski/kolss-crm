export default function LeadDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-[var(--border)]" />
      <div className="h-8 w-64 rounded bg-[var(--border)]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[var(--border)]" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-[var(--border)]" />
    </div>
  );
}
