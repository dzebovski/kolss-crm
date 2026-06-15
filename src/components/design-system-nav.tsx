"use client";

import { useEffect, useState } from "react";

const sections = [
  ["foundations", "Основи"],
  ["actions", "Дії та статуси"],
  ["forms", "Форми"],
  ["navigation", "Навігація"],
  ["cards", "Картки"],
  ["data", "Списки й таблиці"],
  ["crm", "CRM-патерни"],
  ["feedback", "Стани"],
] as const;

type SectionId = (typeof sections)[number][0];

export function DesignSystemNav() {
  const [activeId, setActiveId] = useState<SectionId>(sections[0][0]);

  useEffect(() => {
    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const activationLine = window.scrollY + 140;
        let currentId: SectionId = sections[0][0];

        for (const [id] of sections) {
          const section = document.getElementById(id);
          const sectionTop = section
            ? section.getBoundingClientRect().top + window.scrollY
            : null;
          if (sectionTop !== null && sectionTop <= activationLine) {
            currentId = id;
          }
        }

        setActiveId(currentId);
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  function navigateTo(id: SectionId) {
    const section = document.getElementById(id);
    if (!section) return;

    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <nav className="sticky top-6" aria-label="Компоненти дизайн-системи">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
        Компоненти
      </p>
      <ul className="space-y-0.5">
        {sections.map(([id, label]) => {
          const active = activeId === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  navigateTo(id);
                }}
                className={`block rounded-md px-2.5 py-1.5 text-sm outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-focus)] ${
                  active
                    ? "bg-[var(--ds-surface-3)] font-medium text-[var(--ds-foreground)] hover:bg-[var(--ds-border)]"
                    : "text-[var(--ds-foreground-light)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)]"
                }`}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
