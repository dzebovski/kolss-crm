"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { DSIcon } from "@/components/ui/design-system";

type FeedbackTone = "loading" | "success" | "error";

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
};

type FeedbackApi = {
  loading: (message?: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  dismiss: () => void;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

function toneStyles(tone: FeedbackTone) {
  switch (tone) {
    case "loading":
      return "border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground)]";
    case "success":
      return "border-[var(--ds-success-border)] bg-[var(--ds-success-soft)] text-[var(--ds-success-strong)]";
    case "error":
      return "border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]";
  }
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const tf = useTranslations("feedback");
  const [current, setCurrent] = useState<FeedbackState | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<number | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setCurrent((prev) => {
      if (prev?.tone !== "loading") return prev;
      return null;
    });
    setVisible(false);
  }, [clearDismissTimer]);

  const close = useCallback(() => {
    clearDismissTimer();
    setVisible(false);
    window.setTimeout(() => setCurrent(null), 200);
  }, [clearDismissTimer]);

  const show = useCallback(
    (tone: FeedbackTone, message: string, autoDismissMs?: number) => {
      clearDismissTimer();
      startTransition(() => {
        setCurrent({ tone, message });
        requestAnimationFrame(() => setVisible(true));
      });

      if (autoDismissMs) {
        dismissTimer.current = window.setTimeout(() => {
          startTransition(() => {
            setVisible(false);
            window.setTimeout(() => setCurrent(null), 200);
          });
        }, autoDismissMs);
      }
    },
    [clearDismissTimer]
  );

  const api = useMemo<FeedbackApi>(
    () => ({
      loading: (message) => show("loading", message ?? tf("loading")),
      success: (message) => show("success", message, 3500),
      error: (message) => show("error", message, 6000),
      dismiss,
    }),
    [dismiss, show, tf]
  );

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[80] w-[min(420px,calc(100vw-32px))] -translate-x-1/2"
        aria-live="polite"
        aria-atomic="true"
      >
        {current && (
          <div
            role={current.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-[0_14px_36px_rgba(24,24,23,0.16)] transition-all duration-200 ${
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            } ${toneStyles(current.tone)}`}
          >
            <span className="grid size-5 shrink-0 place-items-center">
              {current.tone === "loading" ? (
                <span
                  className="size-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
                  aria-hidden
                />
              ) : (
                <DSIcon
                  name={current.tone === "success" ? "check" : "x"}
                  className="size-3.5"
                />
              )}
            </span>
            <p className="min-w-0 flex-1 text-sm leading-5">{current.message}</p>
            {current.tone !== "loading" && (
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="grid size-6 shrink-0 place-items-center rounded-full opacity-65 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
              >
                <DSIcon name="x" className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
