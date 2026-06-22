import type { ReactNode } from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function DSSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-md bg-[var(--ds-surface-3)]",
        className
      )}
    />
  );
}

export function DSSkeletonText({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <DSSkeleton
          key={index}
          className={cx("h-4", index === lines - 1 && lines > 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function DSSkeletonPageHeader({
  chips = 0,
}: {
  chips?: number;
}) {
  return (
    <div className="mb-6 space-y-4">
      <DSSkeleton className="h-8 w-48" />
      {chips > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: chips }).map((_, index) => (
            <DSSkeleton key={index} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

export function DSSkeletonTable({
  rows = 8,
}: {
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--ds-border)]">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex gap-4 border-b border-[var(--ds-border)] px-4 py-4 last:border-0"
        >
          <DSSkeleton className="h-4 flex-1" />
          <DSSkeleton className="h-4 w-24" />
          <DSSkeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function DSSkeletonPanel({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-1)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DSSkeletonRoot({
  ariaLabel,
  children,
  className,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("animate-pulse", className)}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
