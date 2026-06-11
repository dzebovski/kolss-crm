export default function ProjectDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 rounded bg-[var(--border)]" />
      <div className="h-8 w-64 rounded bg-[var(--border)]" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 rounded-xl bg-[var(--border)] lg:col-span-1" />
        <div className="h-40 rounded-xl bg-[var(--border)] lg:col-span-2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-[var(--border)]" />
        <div className="h-64 rounded-xl bg-[var(--border)]" />
      </div>
    </div>
  );
}
