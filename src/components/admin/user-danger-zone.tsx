"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deactivateUser,
  deleteUserPermanently,
  reactivateUser,
} from "@/actions/users";
import { formatSupabaseError } from "@/lib/errors";
import type { AdminUserRow } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

type Props = {
  user: AdminUserRow;
  mode: "active" | "deactivated";
};

export function UserDangerZone({ user, mode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (user.profile.role === "super_admin") return null;

  function onDeactivate() {
    setError(null);
    startTransition(async () => {
      try {
        await deactivateUser(user.id, confirmEmail);
        router.push("/app/admin/users/deactivated");
        router.refresh();
      } catch (err) {
        setError(formatSupabaseError(err));
      }
    });
  }

  function onReactivate() {
    setError(null);
    startTransition(async () => {
      try {
        await reactivateUser(user.id);
        router.push(`/app/admin/users/${user.id}`);
        router.refresh();
      } catch (err) {
        setError(formatSupabaseError(err));
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUserPermanently(user.id, confirmEmail);
        router.push("/app/admin/users/deactivated");
        router.refresh();
      } catch (err) {
        setError(formatSupabaseError(err));
      }
    });
  }

  if (mode === "deactivated") {
    return (
      <div className="mt-8 max-w-lg space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-lg font-medium text-red-800">Деактивований обліковий запис</h2>
        {user.profile.deactivated_at && (
          <p className="text-sm text-[var(--muted)]">
            Деактивовано:{" "}
            {new Date(user.profile.deactivated_at).toLocaleString("uk-UA")}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={pending} onClick={onReactivate}>
            {pending ? "…" : "Відновити доступ"}
          </Button>
          {!showDelete ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setShowDelete(true)}
            >
              Видалити назавжди
            </Button>
          ) : (
            <div className="w-full space-y-2">
              <p className="text-sm text-red-700">
                Введіть email <strong>{user.email}</strong> для підтвердження
                видалення. Цю дію не можна скасувати.
              </p>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user.email}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={onDelete}
                  className="!bg-red-600 hover:!bg-red-700"
                >
                  {pending ? "…" : "Підтвердити видалення"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    setShowDelete(false);
                    setConfirmEmail("");
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-lg space-y-4 rounded-xl border border-red-200 bg-red-50/50 p-6">
      <h2 className="text-lg font-medium text-red-800">Небезпечна зона</h2>
      <p className="text-sm text-[var(--muted)]">
        Деактивація заборонить вхід у CRM. Обліковий запис можна відновити або
        видалити назавжди пізніше.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!showDeactivate ? (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => setShowDeactivate(true)}
          className="!border-red-300 !text-red-700"
        >
          Деактивувати користувача
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-red-700">
            Введіть email <strong>{user.email}</strong> для підтвердження
          </p>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={pending}
              onClick={onDeactivate}
              className="!bg-red-600 hover:!bg-red-700"
            >
              {pending ? "…" : "Підтвердити деактивацію"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setShowDeactivate(false);
                setConfirmEmail("");
              }}
            >
              Скасувати
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
