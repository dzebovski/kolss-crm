import Link from "next/link";
import { roleLabel } from "@/lib/roles";
import type { AdminUserRow } from "@/lib/types/database";

type Section = {
  title: string;
  users: AdminUserRow[];
};

function groupUsersByOffice(users: AdminUserRow[]): Section[] {
  const kyiv: AdminUserRow[] = [];
  const warsaw: AdminUserRow[] = [];
  const multi: AdminUserRow[] = [];

  for (const user of users) {
    if (user.profile.role === "super_admin") continue;
    const codes = new Set(user.offices.map((o) => o.code));
    if (codes.size >= 2) {
      multi.push(user);
    } else if (codes.has("kyiv")) {
      kyiv.push(user);
    } else if (codes.has("warsaw")) {
      warsaw.push(user);
    } else if (user.offices.length === 0) {
      multi.push(user);
    }
  }

  const sortByName = (a: AdminUserRow, b: AdminUserRow) =>
    (a.profile.display_name ?? a.email).localeCompare(
      b.profile.display_name ?? b.email,
      "uk"
    );

  const sections: Section[] = [];
  if (kyiv.length) {
    sections.push({ title: "Київ", users: kyiv.sort(sortByName) });
  }
  if (warsaw.length) {
    sections.push({ title: "Варшава", users: warsaw.sort(sortByName) });
  }
  if (multi.length) {
    sections.push({
      title: "Обидва офіси",
      users: multi.sort(sortByName),
    });
  }

  const superAdmins = users
    .filter((u) => u.profile.role === "super_admin")
    .sort(sortByName);
  if (superAdmins.length) {
    sections.push({ title: "Супер-адміни", users: superAdmins });
  }

  return sections;
}

function officeNames(user: AdminUserRow): string {
  if (!user.offices.length) return "—";
  return user.offices.map((o) => o.name_uk).join(", ");
}

function UserTable({ users }: { users: AdminUserRow[] }) {
  if (!users.length) {
    return (
      <p className="px-4 py-8 text-center text-[var(--muted)]">
        Користувачів немає.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-[var(--border)] bg-[var(--background)]">
        <tr>
          <th className="px-4 py-3 font-medium">Імʼя</th>
          <th className="px-4 py-3 font-medium">Email</th>
          <th className="px-4 py-3 font-medium">Роль</th>
          <th className="px-4 py-3 font-medium">Офіси</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
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
            <td className="px-4 py-3">{officeNames(user)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type Props = {
  users: AdminUserRow[];
  grouped?: boolean;
};

export function UsersTable({ users, grouped = true }: Props) {
  if (!grouped) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <UserTable users={users} />
      </div>
    );
  }

  const sections = groupUsersByOffice(users);

  if (!sections.length) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <p className="px-4 py-8 text-center text-[var(--muted)]">
          Активних користувачів немає.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-lg font-medium">{section.title}</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <UserTable users={section.users} />
          </div>
        </section>
      ))}
    </div>
  );
}
