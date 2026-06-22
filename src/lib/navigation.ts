export const RETURN_TO_HEADER = "x-kolss-return-to";

export function safeAppReturnTo(
  value: string | null | undefined,
  fallback = "/app/dashboard"
): string {
  if (
    !value ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  const base = "http://kolss.local";
  const parsed = new URL(value, base);
  if (
    parsed.origin !== base ||
    (parsed.pathname !== "/app" && !parsed.pathname.startsWith("/app/"))
  ) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
