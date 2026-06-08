import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app/leads" className="text-lg font-semibold tracking-tight">
            KOLSS CRM
          </Link>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link href="/app/leads" className="hover:text-[var(--foreground)]">
              Ліди
            </Link>
            <Link
              href="/app/leads/new"
              className="hover:text-[var(--foreground)]"
            >
              Новий лід
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted)]">
            {profile?.display_name ?? user?.email}
            {profile?.role ? ` · ${profile.role}` : ""}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
