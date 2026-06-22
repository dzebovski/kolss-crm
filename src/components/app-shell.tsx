"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DSIcon, type IconName } from "@/components/ui/design-system";
import { GlobalLeadSearch } from "@/components/global-lead-search";
import { SignOutButton } from "@/components/sign-out-button";
import { ViewAsSwitcher } from "@/components/view-as-switcher";
import { FeedbackProvider } from "@/components/feedback-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import type { ViewAsMode } from "@/lib/view-as";

type Labels = {
  dashboard: string;
  leads: string;
  newLead: string;
  users: string;
  design: string;
  navigation: string;
  account: string;
  close: string;
  searchPlaceholder: string;
  searchEmpty: string;
  searchHint: string;
  searchLoading: string;
};

type Props = {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  officeCode?: string;
  viewAs: ViewAsMode | null | undefined;
  previewLabel?: string;
  showAdminNav: boolean;
  labels: Labels;
};

export function AppShell({
  children,
  userName,
  roleLabel,
  officeCode,
  viewAs,
  previewLabel,
  showAdminNav,
  labels,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [accountOpen]);

  const navigation: Array<{
    href: string;
    label: string;
    icon: IconName;
    exact?: boolean;
  }> = [
    { href: "/app/dashboard", label: labels.dashboard, icon: "grid", exact: true },
    { href: "/app/leads", label: labels.leads, icon: "inbox" },
    ...(showAdminNav
      ? [
          { href: "/app/admin/users", label: labels.users, icon: "users" as IconName },
          { href: "/app/design", label: labels.design, icon: "layout" as IconName },
        ]
      : []),
  ];

  function isActive(item: (typeof navigation)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-3 pt-4">
        <Link
          href="/app/leads/new"
          onClick={() => setMobileOpen(false)}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--ds-primary-border)] bg-[var(--ds-primary)] px-3 text-sm font-medium text-white shadow-[var(--ds-shadow-button)] transition-[background-color,border-color,box-shadow] hover:bg-[var(--ds-primary-hover)] hover:shadow-[var(--ds-shadow-button-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
        >
          <DSIcon name="plus" />
          {labels.newLead}
        </Link>
      </div>
      <nav aria-label={labels.navigation} className="space-y-1 px-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex h-9 items-center gap-2.5 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-focus)] ${
              isActive(item)
                ? "bg-[var(--ds-surface-3)] font-medium text-[var(--ds-foreground)]"
                : "text-[var(--ds-foreground-light)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)]"
            }`}
          >
            <DSIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-[var(--ds-border)] p-3">
        <div className="rounded-md bg-[var(--ds-surface-2)] px-3 py-2.5">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--ds-foreground-lighter)]">
            {roleLabel}
            {previewLabel ? ` · ${previewLabel}` : ""}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <FeedbackProvider>
      <NavigationProgress />
      <div className="min-h-screen bg-[var(--ds-surface-0)] text-[var(--ds-foreground)]">
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--ds-border)] bg-[color:rgba(255,255,255,0.94)] backdrop-blur">
        <div className="flex h-full items-center gap-3 px-3 sm:px-4">
          <button
            type="button"
            aria-label={labels.navigation}
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-md text-[var(--ds-foreground-light)] hover:bg-[var(--ds-surface-2)] md:hidden"
          >
            <DSIcon name="layout" />
          </button>
          <Link href="/app/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-[var(--ds-primary)] text-sm font-semibold text-white">
              K
            </span>
            <span className="hidden items-baseline gap-1.5 sm:flex">
              <span className="text-sm font-semibold tracking-tight">KOLSS</span>
              <span className="text-xs text-[var(--ds-foreground-lighter)]">CRM</span>
            </span>
            {officeCode && (
              <span className="hidden rounded border border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ds-foreground-lighter)] lg:inline">
                {officeCode}
              </span>
            )}
          </Link>

          <div className="mx-auto min-w-0 flex-1 md:max-w-xl">
            <GlobalLeadSearch
              labels={{
                placeholder: labels.searchPlaceholder,
                empty: labels.searchEmpty,
                hint: labels.searchHint,
                loading: labels.searchLoading,
              }}
            />
          </div>

          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              aria-label={labels.account}
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
              className="flex h-9 items-center gap-2 rounded-md px-1.5 outline-none transition-colors hover:bg-[var(--ds-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
            >
              <span className="grid size-7 place-items-center rounded-full bg-[var(--ds-accent-soft)] text-[10px] font-semibold text-[var(--ds-accent-strong)]">
                {userName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="hidden max-w-36 text-left lg:block">
                <span className="block truncate text-xs font-medium">{userName}</span>
                <span className="block truncate text-[10px] text-[var(--ds-foreground-lighter)]">
                  {roleLabel}
                </span>
              </span>
              <DSIcon name="chevron-down" className="hidden text-[var(--ds-foreground-lighter)] lg:block" />
            </button>
            {accountOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-1)] p-3 shadow-[0_16px_40px_rgba(24,24,23,0.14)]">
                <div className="border-b border-[var(--ds-border)] pb-3">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                    {roleLabel}
                    {previewLabel ? ` · ${previewLabel}` : ""}
                  </p>
                </div>
                {viewAs && (
                  <div className="py-3">
                    <ViewAsSwitcher currentMode={viewAs} />
                  </div>
                )}
                <div className="flex justify-end border-t border-[var(--ds-border)] pt-2">
                  <SignOutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[216px] shrink-0 border-r border-[var(--ds-border)] bg-[var(--ds-surface-1)] md:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={labels.close}
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[280px] border-r border-[var(--ds-border)] bg-[var(--ds-surface-1)] shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-[var(--ds-border)] px-3">
              <span className="text-sm font-semibold">KOLSS CRM</span>
              <button
                type="button"
                aria-label={labels.close}
                onClick={() => setMobileOpen(false)}
                className="grid size-8 place-items-center rounded-md hover:bg-[var(--ds-surface-2)]"
              >
                <DSIcon name="x" />
              </button>
            </div>
            <div className="h-[calc(100%-56px)]">{sidebar}</div>
          </aside>
        </div>
      )}
      </div>
    </FeedbackProvider>
  );
}
