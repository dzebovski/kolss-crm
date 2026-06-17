export const locales = ["en", "uk", "pl"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "uk";

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
