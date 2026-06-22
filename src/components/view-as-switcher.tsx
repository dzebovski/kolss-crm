"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setViewAsMode } from "@/actions/view-as";
import { DSSelect } from "@/components/ui/design-system";
import type { ViewAsMode } from "@/lib/view-as";

const MODES: ViewAsMode[] = ["super_admin", "kyiv", "warsaw"];

export function ViewAsSwitcher({ currentMode }: { currentMode: ViewAsMode }) {
  const t = useTranslations("viewAs");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(mode: ViewAsMode) {
    if (mode === currentMode) return;
    startTransition(async () => {
      await setViewAsMode(mode);
      router.refresh();
    });
  }

  return (
    <DSSelect
      aria-label={t("label")}
      value={currentMode}
      disabled={pending}
      onChange={(event) => onChange(event.target.value as ViewAsMode)}
      className="w-56"
    >
      {MODES.map((mode) => (
        <option key={mode} value={mode}>
          {t(mode)}
        </option>
      ))}
    </DSSelect>
  );
}
