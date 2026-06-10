"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "@/actions/users";
import { formatSupabaseError } from "@/lib/errors";
import { ASSIGNABLE_ROLES, roleLabel } from "@/lib/roles";
import type { AdminUserRow, Office, UserRole } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

type Props = {
  offices: Office[];
  user?: AdminUserRow;
};

export function UserForm({ offices, user }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!user;

  const [role, setRole] = useState<UserRole>(
    user?.profile.role && ASSIGNABLE_ROLES.includes(user.profile.role)
      ? user.profile.role
      : "office_member"
  );
  const [officeIds, setOfficeIds] = useState<string[]>(
    user?.offices.map((o) => o.id) ?? []
  );

  function toggleOffice(officeId: string) {
    setOfficeIds((prev) =>
      prev.includes(officeId)
        ? prev.filter((id) => id !== officeId)
        : [...prev, officeId]
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("office_ids");
    for (const id of officeIds) fd.append("office_ids", id);

    startTransition(async () => {
      try {
        if (isEdit && user) {
          await updateUser(user.id, fd);
          router.push(`/app/admin/users/${user.id}`);
        } else {
          const userId = await createUser(fd);
          router.push(`/app/admin/users/${userId}`);
        }
        router.refresh();
      } catch (err) {
        setError(formatSupabaseError(err));
      }
    });
  }

  const roleHint =
    role === "curator"
      ? "Куратор має доступ до лідів усіх обраних офісів."
      : role === "office_admin"
        ? "Адмін офісу — керування в межах свого офісу (права як у менеджера)."
        : "Менеджер — робота з лідами свого офісу.";

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-lg space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
    >
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Імʼя</label>
        <input
          name="display_name"
          required
          defaultValue={user?.profile.display_name ?? ""}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          defaultValue={user?.email ?? ""}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          {isEdit ? "Новий пароль (необовʼязково)" : "Пароль"}
        </label>
        <input
          type="password"
          name="password"
          required={!isEdit}
          minLength={12}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Підтвердження пароля
        </label>
        <input
          type="password"
          name="password_confirm"
          required={!isEdit}
          minLength={12}
          autoComplete="new-password"
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Роль</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
        >
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--muted)]">{roleHint}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm text-[var(--muted)]">Офіси</legend>
        <div className="space-y-2">
          {offices.map((office) => (
            <label
              key={office.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={officeIds.includes(office.id)}
                onChange={() => toggleOffice(office.id)}
              />
              {office.name_uk}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Збереження…" : isEdit ? "Зберегти" : "Створити"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => router.back()}
        >
          Скасувати
        </Button>
      </div>
    </form>
  );
}
