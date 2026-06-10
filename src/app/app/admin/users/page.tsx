import Link from "next/link";
import { listUsers } from "@/actions/users";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const users = await listUsers(true);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Користувачі</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/app/admin/users/deactivated"
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:bg-[var(--background)]"
          >
            Деактивовані
          </Link>
          <Link
            href="/app/admin/users/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            + Новий користувач
          </Link>
        </div>
      </div>

      <UsersTable users={users} grouped />
    </div>
  );
}
