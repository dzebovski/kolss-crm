export const OFFICE_TIMEZONE: Record<string, string> = {
  kyiv: "Europe/Kyiv",
  warsaw: "Europe/Warsaw",
  london: "Europe/London",
};

export function timezoneForOffice(officeCode: string | undefined): string {
  return OFFICE_TIMEZONE[officeCode ?? "kyiv"] ?? "Europe/Kyiv";
}
