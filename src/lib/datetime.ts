const OFFICE_TIMEZONES: Record<string, string> = {
  kyiv: "Europe/Kyiv",
  warsaw: "Europe/Warsaw",
  london: "Europe/London",
};

export function officeTimeZone(officeCode: string | undefined): string {
  if (officeCode && OFFICE_TIMEZONES[officeCode]) {
    return OFFICE_TIMEZONES[officeCode];
  }
  return OFFICE_TIMEZONES.kyiv;
}

/** Value for `<input type="datetime-local" />` in local browser timezone */
export function toDatetimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** HH:MM, DD.MM.YYYY in the office timezone (EET/EEST, CET/CEST, …) */
export function formatLeadDateTime(
  iso: string,
  officeCode?: string
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: officeTimeZone(officeCode),
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")}, ${get("day")}.${get("month")}.${get("year")}`;
}
