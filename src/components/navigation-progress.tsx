"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useFeedback } from "@/components/feedback-provider";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feedback = useFeedback();
  const tn = useTranslations("navigation");
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigating = useRef(false);
  const progressTimer = useRef<number | null>(null);
  const completeTimer = useRef<number | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const clearTimers = useCallback(() => {
    if (progressTimer.current !== null) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    if (completeTimer.current !== null) {
      window.clearTimeout(completeTimer.current);
      completeTimer.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    if (navigating.current) return;
    navigating.current = true;
    clearTimers();

    startTransition(() => {
      setActive(true);
      setProgress(12);
      feedback.loading(tn("loading"));
    });

    progressTimer.current = window.setInterval(() => {
      setProgress((value) => (value >= 88 ? value : value + Math.random() * 10));
    }, 350);
  }, [clearTimers, feedback, tn]);

  const completeNavigation = useCallback(() => {
    if (!navigating.current) return;
    navigating.current = false;
    clearTimers();

    startTransition(() => {
      setProgress(100);
    });

    completeTimer.current = window.setTimeout(() => {
      startTransition(() => {
        setActive(false);
        setProgress(0);
        feedback.dismiss();
      });
    }, 220);
  }, [clearTimers, feedback]);

  useEffect(() => {
    completeNavigation();
  }, [routeKey, completeNavigation]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;

      const nextUrl = new URL(anchor.href);
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      const nextKey = `${nextUrl.pathname}${nextUrl.search}`;
      if (nextKey !== currentUrl) {
        startNavigation();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startNavigation]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-14 z-50 h-0.5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label={tn("loading")}
    >
      <div
        className="h-full bg-[var(--ds-accent)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
