import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById } from "@/actions/users";
import { UserDangerZone } from "@/components/admin/user-danger-zone";
import { UserForm } from "@/components/admin/user-form";
import { roleLabel } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { Office } from "@/lib/types/database";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const supabase = await createClient();
  const { data: offices } = await supabase
    .from("offices")
    .select("*")
    .eq("is_active", true)
    .order("code");

  const isSuperAdmin = user.profile.role === "super_admin";

  return (
    <div>
      <div className="mb-6">
        <Link
          href={
            user.profile.is_active
              ? "/app/admin/users"
              : "/app/admin/users/deactivated"
          }
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← {user.profile.is_active ? "Користувачі" : "Деактивовані"}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {user.profile.display_name ?? user.email}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {user.email} · {roleLabel(user.profile.role)}
        </p>
      </div>

      {isSuperAdmin ? (
        <div className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          Супер-адміністратора не можна редагувати через цю панель. Зміни
          вносяться вручну в Supabase.
        </div>
      ) : user.profile.is_active ? (
        <>
          <UserForm offices={(offices as Office[]) ?? []} user={user} />
          <UserDangerZone user={user} mode="active" />
        </>
      ) : (
        <UserDangerZone user={user} mode="deactivated" />
      )}
    </div>
  );
}
