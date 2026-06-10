import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserForm } from "@/components/admin/user-form";
import type { Office } from "@/lib/types/database";

export default async function NewUserPage() {
  const supabase = await createClient();
  const { data: offices } = await supabase
    .from("offices")
    .select("*")
    .eq("is_active", true)
    .order("code");

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/app/admin/users"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Користувачі
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Новий користувач</h1>
      </div>
      <UserForm offices={(offices as Office[]) ?? []} />
    </div>
  );
}
