import Link from "next/link";
import { listUsers } from "@/actions/users";
import { DeactivatedUserActions } from "@/components/admin/deactivated-users-actions";
import { roleLabel } from "@/lib/roles";

export default async function DeactivatedUsersPage() {
  const users = await listUsers(false);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/app/admin/users"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Користувачі
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Деактивовані користувачі</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)]">
            <tr>
              <th className="px-4 py-3 font-medium">Імʼя</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/app/admin/users/${user.id}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {user.profile.display_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{roleLabel(user.profile.role)}</td>
                <td className="px-4 py-3">
                  <DeactivatedUserActions userId={user.id} email={user.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">
            Деактивованих користувачів немає.
          </p>
        )}
      </div>
    </div>
  );
}
