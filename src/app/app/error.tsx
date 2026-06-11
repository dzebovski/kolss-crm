"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Щось пішло не так</h1>
      <p className="text-sm text-[var(--muted)]">
        Спробуйте оновити сторінку або поверніться пізніше.
      </p>
      <Button type="button" onClick={reset}>
        Спробувати знову
      </Button>
    </div>
  );
}
