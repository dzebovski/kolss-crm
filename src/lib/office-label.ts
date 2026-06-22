import type { Office } from "@/lib/types/database";

const OFFICE_FLAG_EMOJI: Record<string, string> = {
  kyiv: "🇺🇦",
  warsaw: "🇵🇱",
};

export function getOfficeFlagEmoji(officeCode: string): string {
  return OFFICE_FLAG_EMOJI[officeCode] ?? "";
}

export function getOfficeLabel(
  office: Office,
  locale: string,
  translate: (key: string) => string
): string {
  const key = `offices.${office.code}`;
  try {
    const translated = translate(key);
    if (translated !== key) return translated;
  } catch {
    // fall through to DB names
  }

  if (locale === "pl") return office.name_pl;
  return office.name_uk;
}
