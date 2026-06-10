import { timezoneForOffice } from "@/lib/office-timezone";

const CALLBACK_HOUR_END = 18;
const NEXT_DAY_CALLBACK_HOUR = 10;

function getOfficeLocalParts(date: Date, officeCode: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezoneForOffice(officeCode),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: get("weekday"),
  };
}

function utcFromOfficeLocal(
  officeCode: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezoneForOffice(officeCode),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const candidate = new Date(guess.getTime() + offsetHours * 60 * 60 * 1000);
    const parts = formatter.formatToParts(candidate);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");
    if (
      get("year") === year &&
      get("month") === month &&
      get("day") === day &&
      get("hour") === hour
    ) {
      return candidate;
    }
  }

  return guess;
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function nextBusinessDayAtTen(
  officeCode: string,
  year: number,
  month: number,
  day: number
) {
  let cursor = addCalendarDays(year, month, day, 1);
  for (let i = 0; i < 7; i++) {
    const probe = utcFromOfficeLocal(
      officeCode,
      cursor.year,
      cursor.month,
      cursor.day,
      12
    );
    const { weekday } = getOfficeLocalParts(probe, officeCode);
    if (weekday !== "Sat" && weekday !== "Sun") {
      return utcFromOfficeLocal(
        officeCode,
        cursor.year,
        cursor.month,
        cursor.day,
        NEXT_DAY_CALLBACK_HOUR
      );
    }
    cursor = addCalendarDays(cursor.year, cursor.month, cursor.day, 1);
  }
  return utcFromOfficeLocal(
    officeCode,
    cursor.year,
    cursor.month,
    cursor.day,
    NEXT_DAY_CALLBACK_HOUR
  );
}

/** Due date for "no answer" callback: +2h, or next business day 10:00 if after 18:00 office time. */
export function computeNoAnswerDueAt(
  now: Date,
  officeCode: string
): Date {
  const local = getOfficeLocalParts(now, officeCode);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const localAfterTwo = getOfficeLocalParts(twoHoursLater, officeCode);

  if (
    local.hour >= CALLBACK_HOUR_END ||
    localAfterTwo.hour >= CALLBACK_HOUR_END
  ) {
    return nextBusinessDayAtTen(
      officeCode,
      local.year,
      local.month,
      local.day
    );
  }

  return twoHoursLater;
}
