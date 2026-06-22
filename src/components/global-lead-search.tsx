"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  searchAccessibleLeads,
  type LeadSearchResult,
} from "@/actions/search";
import { DSBadge, DSIcon } from "@/components/ui/design-system";
import { formatPhoneDisplay } from "@/lib/phone";

type Props = {
  labels: {
    placeholder: string;
    empty: string;
    hint: string;
    loading: string;
  };
};

export function GlobalLeadSearch({ labels }: Props) {
  const router = useRouter();
  const tw = useTranslations("workflow");
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      return;
    }

    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const items = await searchAccessibleLeads(normalized);
          if (currentRequest !== requestId.current) return;
          setResults(items);
          setActiveIndex(0);
          setOpen(true);
        } catch {
          if (currentRequest !== requestId.current) return;
          setResults([]);
          setOpen(true);
        }
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  function select(result: LeadSearchResult) {
    setOpen(false);
    setQuery("");
    router.push(`/app/leads/${result.id}`);
  }

  return (
    <div className="relative w-full max-w-xl">
      <DSIcon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--ds-foreground-lighter)]"
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            requestId.current += 1;
            setResults([]);
            setOpen(false);
          }
        }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (!open || !results.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % results.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + results.length) % results.length);
          } else if (event.key === "Enter") {
            event.preventDefault();
            select(results[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-controls="global-lead-search-results"
        aria-expanded={open}
        className="h-9 w-full rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-0)] pl-9 pr-14 text-sm text-[var(--ds-foreground)] shadow-[var(--ds-shadow-control)] outline-none transition-[background-color,border-color,box-shadow] placeholder:text-[var(--ds-foreground-lighter)] hover:border-[var(--ds-border-hover)] focus:border-[var(--ds-accent)] focus:bg-[var(--ds-surface-1)] focus:ring-2 focus:ring-[var(--ds-focus-soft)]"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
        ⌘ K
      </kbd>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-1)] shadow-[0_16px_40px_rgba(24,24,23,0.14)]">
          <div className="border-b border-[var(--ds-border)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ds-foreground-lighter)]">
            {pending ? labels.loading : labels.hint}
          </div>
          {!pending && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--ds-foreground-lighter)]">
              {labels.empty}
            </p>
          ) : (
            <ul
              id="global-lead-search-results"
              role="listbox"
              className="max-h-80 overflow-y-auto py-1"
            >
              {results.map((result, index) => (
                <li key={result.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(result)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors ${
                      index === activeIndex
                        ? "bg-[var(--ds-accent-soft)]"
                        : "hover:bg-[var(--ds-surface-2)]"
                    }`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-0)] text-[var(--ds-foreground-light)]">
                      <DSIcon name="user" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {result.name ?? "—"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--ds-foreground-lighter)]">
                        {formatPhoneDisplay(result.phone, result.office?.code)}
                        {result.email ? ` · ${result.email}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <DSBadge>{tw(`status.${result.workflowStatus}`)}</DSBadge>
                      <span className="text-[10px] text-[var(--ds-foreground-lighter)]">
                        {result.office?.name ?? "—"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
