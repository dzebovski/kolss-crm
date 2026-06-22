import {
  DSSkeleton,
  DSSkeletonPageHeader,
  DSSkeletonPanel,
  DSSkeletonRoot,
  DSSkeletonTable,
} from "@/components/ui/skeleton";

export function LeadsListSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DSSkeletonRoot ariaLabel={ariaLabel}>
      <DSSkeletonPageHeader chips={5} />
      <DSSkeletonTable rows={8} />
    </DSSkeletonRoot>
  );
}

export function LeadDetailSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DSSkeletonRoot ariaLabel={ariaLabel} className="mx-auto max-w-[1480px] space-y-5">
      <DSSkeleton className="h-4 w-24" />
      <DSSkeletonPanel className="h-36" />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <DSSkeletonPanel className="h-56" />
          <DSSkeletonPanel className="h-24" />
          <DSSkeletonPanel className="h-[420px]" />
        </div>
        <div className="space-y-5">
          <DSSkeletonPanel className="h-80" />
          <DSSkeletonPanel className="h-64" />
          <DSSkeletonPanel className="h-48" />
        </div>
      </div>
    </DSSkeletonRoot>
  );
}

export function DashboardSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DSSkeletonRoot ariaLabel={ariaLabel} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DSSkeleton className="h-8 w-40" />
        <DSSkeleton className="h-10 w-full max-w-xl rounded-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <DSSkeletonPanel key={index} className="h-24 p-4">
            <DSSkeleton className="mb-3 h-3 w-24" />
            <DSSkeleton className="h-7 w-16" />
          </DSSkeletonPanel>
        ))}
      </div>
      <DSSkeletonPanel className="h-40" />
      <DSSkeletonPanel className="h-56" />
      <DSSkeletonTable rows={6} />
    </DSSkeletonRoot>
  );
}

export function AdminUsersSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <DSSkeletonRoot ariaLabel={ariaLabel} className="space-y-4">
      <DSSkeleton className="h-8 w-48" />
      <div className="overflow-hidden rounded-xl border border-[var(--ds-border)]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border-b border-[var(--ds-border)] px-4 py-4 last:border-0"
          >
            <DSSkeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </DSSkeletonRoot>
  );
}
