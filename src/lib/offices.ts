import type { Office } from "@/lib/types/database";

export const DEFAULT_CITY_BY_OFFICE_CODE: Record<string, string> = {
  kyiv: "Київ",
  warsaw: "Warsaw",
};

export function defaultCityForOffice(office: Pick<Office, "code">): string {
  return DEFAULT_CITY_BY_OFFICE_CODE[office.code] ?? "";
}
