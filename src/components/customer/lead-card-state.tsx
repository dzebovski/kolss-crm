"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useFeedback } from "@/components/feedback-provider";
import type { LeadPageData } from "@/lib/db/lead-detail";

export const OPTIMISTIC_TASK_PREFIX = "optimistic-task:";

type MutationOptions = {
  key: string;
  successMessage: string;
  optimistic?: (current: LeadPageData) => LeadPageData;
};

type LeadCardState = {
  data: LeadPageData;
  isPending: boolean;
  pendingKey: string | null;
  runMutation: (
    operation: () => Promise<LeadPageData | null>,
    options: MutationOptions
  ) => Promise<LeadPageData | null>;
};

const LeadCardContext = createContext<LeadCardState | null>(null);

export function LeadCardProvider({
  initialData,
  children,
}: {
  initialData: LeadPageData;
  children: React.ReactNode;
}) {
  const tf = useTranslations("feedback");
  const feedback = useFeedback();
  const [data, setData] = useState(initialData);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const dataRef = useRef(initialData);
  const mutationActive = useRef(false);

  const replaceData = useCallback((next: LeadPageData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const runMutation = useCallback(
    async (
      operation: () => Promise<LeadPageData | null>,
      options: MutationOptions
    ) => {
      if (mutationActive.current) {
        throw new Error(tf("waitForCurrentAction"));
      }

      mutationActive.current = true;
      const previous = dataRef.current;
      setPendingKey(options.key);

      if (options.optimistic) {
        replaceData(options.optimistic(previous));
      }

      try {
        const snapshot = await operation();
        if (snapshot) {
          const merged =
            snapshot.attachments.length === 0 && previous.attachments.length > 0
              ? { ...snapshot, attachments: previous.attachments }
              : snapshot;
          replaceData(merged);
        }
        feedback.success(options.successMessage);
        return snapshot;
      } catch (value) {
        if (options.optimistic) replaceData(previous);
        const message = value instanceof Error ? value.message : tf("operationFailed");
        feedback.error(message);
        throw value;
      } finally {
        mutationActive.current = false;
        setPendingKey(null);
      }
    },
    [feedback, replaceData, tf]
  );

  const value = useMemo<LeadCardState>(
    () => ({
      data,
      isPending: pendingKey !== null,
      pendingKey,
      runMutation,
    }),
    [data, pendingKey, runMutation]
  );

  return (
    <LeadCardContext.Provider value={value}>
      {children}
    </LeadCardContext.Provider>
  );
}

export function useLeadCard() {
  const context = useContext(LeadCardContext);
  if (!context) {
    throw new Error("useLeadCard must be used within LeadCardProvider");
  }
  return context;
}

export function isOptimisticTaskId(id: string) {
  return id.startsWith(OPTIMISTIC_TASK_PREFIX);
}
