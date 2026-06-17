/** Callback scheduling verification (run: node scripts/verify-callback-scheduling.mjs) */

const CALLBACK_START = 9;
const MORNING_END = 13;
const AFTERNOON_START = 14;
const BUSINESS_END = 18;
const NEXT_DAY_HOUR = 9;

const OFFICE_TZ = { kyiv: "Europe/Kyiv", warsaw: "Europe/Warsaw" };

function getOfficeLocalParts(date, officeCode) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: OFFICE_TZ[officeCode] ?? OFFICE_TZ.kyiv,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: get("weekday"),
  };
}

function utcFromOfficeLocal(officeCode, year, month, day, hour, minute = 0) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: OFFICE_TZ[officeCode] ?? OFFICE_TZ.kyiv,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  for (let offsetHours = -14; offsetHours <= 14; offsetHours++) {
    const candidate = new Date(guess.getTime() + offsetHours * 60 * 60 * 1000);
    const p = formatter.formatToParts(candidate);
    const get = (type) => Number(p.find((x) => x.type === type)?.value ?? "0");
    if (get("year") === year && get("month") === month && get("day") === day && get("hour") === hour) {
      return candidate;
    }
  }
  return guess;
}

function addCalendarDays(year, month, day, days) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function nextBusinessDayAt(officeCode, year, month, day, hour) {
  let cursor = addCalendarDays(year, month, day, 1);
  for (let i = 0; i < 7; i++) {
    const probe = utcFromOfficeLocal(officeCode, cursor.year, cursor.month, cursor.day, 12);
    const { weekday } = getOfficeLocalParts(probe, officeCode);
    if (weekday !== "Sat" && weekday !== "Sun") {
      return utcFromOfficeLocal(officeCode, cursor.year, cursor.month, cursor.day, hour);
    }
    cursor = addCalendarDays(cursor.year, cursor.month, cursor.day, 1);
  }
  return utcFromOfficeLocal(officeCode, cursor.year, cursor.month, cursor.day, hour);
}

function computeCallbackDueAt(now, officeCode) {
  const local = getOfficeLocalParts(now, officeCode);
  if (local.hour >= CALLBACK_START && local.hour <= MORNING_END) {
    return utcFromOfficeLocal(officeCode, local.year, local.month, local.day, AFTERNOON_START);
  }
  if (local.hour > MORNING_END && local.hour <= BUSINESS_END) {
    return nextBusinessDayAt(officeCode, local.year, local.month, local.day, NEXT_DAY_HOUR);
  }
  return nextBusinessDayAt(officeCode, local.year, local.month, local.day, NEXT_DAY_HOUR);
}

function officeHour(iso, officeCode) {
  return getOfficeLocalParts(new Date(iso), officeCode).hour;
}

const kyiv10 = new Date("2026-06-17T07:00:00.000Z");
const dueSameDay = computeCallbackDueAt(kyiv10, "kyiv");
if (officeHour(dueSameDay.toISOString(), "kyiv") !== 14) {
  console.error("FAIL: 10:00 Kyiv should schedule 14:00 same day");
  process.exit(1);
}

const kyiv16 = new Date("2026-06-17T13:00:00.000Z");
const dueNextDay = computeCallbackDueAt(kyiv16, "kyiv");
if (officeHour(dueNextDay.toISOString(), "kyiv") !== 9) {
  console.error("FAIL: 16:00 Kyiv should schedule next business day 09:00");
  process.exit(1);
}

console.log("callback scheduling checks passed");
