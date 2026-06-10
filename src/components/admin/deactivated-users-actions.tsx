"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateUser, deleteUserPermanently } from "@/actions/users";
import { formatSupabaseError } from "@/lib/errors";
import { Button } from "@/components/ui/button";

type Props = {
  userId: string;
  email: string;
};

export function DeactivatedUserActions({ userId, email }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onReactivate() {
    startTransition(async () => {
      try {
        await reactivateUser(userId);
        router.refresh();
      } catch (err) {
        alert(formatSupabaseError(err));
      }
    });
  }

  function onDelete() {
    const confirmEmail = prompt(
      `Введіть email для підтвердження видалення:\n${email}`
    );
    if (!confirmEmail) return;
    startTransition(async () => {
      try {
        await deleteUserPermanently(userId, confirmEmail);
        router.refresh();
      } catch (err) {
        alert(formatSupabaseError(err));
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={onReactivate}>
        Відновити
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={pending}
        onClick={onDelete}
        className="!text-red-600"
      >
        Видалити
      </Button>
    </div>
  );
}
