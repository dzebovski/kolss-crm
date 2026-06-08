type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function formatSupabaseError(err: unknown, fallback = "Помилка"): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const e = err as SupabaseLikeError;
    if (typeof e.message === "string" && e.message) return e.message;
  }
  return fallback;
}
