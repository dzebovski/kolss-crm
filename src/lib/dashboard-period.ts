export type DatePreset = "today" | "yesterday" | "week" | "month";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDayLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function endOfDayLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function presetRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { from: formatDateInput(today), to: formatDateInput(today) };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const value = formatDateInput(yesterday);
      return { from: value, to: value };
    }
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      return { from: formatDateInput(weekStart), to: formatDateInput(today) };
    }
    case "month": {
      const monthStart = new Date(today);
      monthStart.setDate(monthStart.getDate() - 29);
      return { from: formatDateInput(monthStart), to: formatDateInput(today) };
    }
  }
}

export function defaultDateRange(): { from: string; to: string } {
  return presetRange("month");
}

export function parseDateParam(value: string | undefined): string | undefined {
  if (!value || !DATE_RE.test(value)) return undefined;
  const parsed = startOfDayLocal(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return value;
}

export function resolveDashboardDateRange(params: {
  from?: string;
  to?: string;
}): { from: string; to: string; fromIso: string; toIso: string } {
  const fallback = defaultDateRange();
  let from = parseDateParam(params.from) ?? fallback.from;
  let to = parseDateParam(params.to) ?? fallback.to;

  if (startOfDayLocal(from) > startOfDayLocal(to)) {
    [from, to] = [to, from];
  }

  return {
    from,
    to,
    fromIso: startOfDayLocal(from).toISOString(),
    toIso: endOfDayLocal(to).toISOString(),
  };
}

export function detectActivePreset(from: string, to: string): DatePreset | null {
  const presets: DatePreset[] = ["today", "yesterday", "week", "month"];
  for (const preset of presets) {
    const range = presetRange(preset);
    if (range.from === from && range.to === to) return preset;
  }
  return null;
}
