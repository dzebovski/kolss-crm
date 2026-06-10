const SOURCE_LABELS: Record<string, string> = {
  meta_lead_ads: "Facebook Forms",
  google_ads: "Google Ads",
  site_form: "Site Form",
  manual: "Вручну",
};

export function sourceSystemLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return SOURCE_LABELS[code] ?? code;
}
