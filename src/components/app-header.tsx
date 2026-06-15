import Link from "next/link";
import { getSessionContext } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { SignOutButton } from "./sign-out-button";

export async function AppHeader() {
  const ctx = await getSessionContext();
  const navLinkClass =
    "rounded-md px-2 py-1 transition-colors duration-150 hover:bg-[var(--background)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app/dashboard" className="text-lg font-semibold tracking-tight">
            KOLSS CRM
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link
              href="/app/dashboard"
              className={navLinkClass}
            >
              Дашборд
            </Link>
            <Link href="/app/leads" className={navLinkClass}>
              Ліди
            </Link>
            <Link href="/app/projects" className={navLinkClass}>
              Проєкти
            </Link>
            <Link
              href="/app/leads/new"
              className={navLinkClass}
            >
              Новий лід
            </Link>
            {ctx?.profile.role === "super_admin" && (
              <>
                <Link
                  href="/app/admin/users"
                  className={navLinkClass}
                >
                  Користувачі
                </Link>
                <Link
                  href="/app/design"
                  className={navLinkClass}
                >
                  Дизайн
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted)]">
            {ctx?.profile.display_name ?? ctx?.user.email}
            {ctx?.profile.role ? ` · ${roleLabel(ctx.profile.role)}` : ""}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
