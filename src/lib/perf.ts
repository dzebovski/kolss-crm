import "server-only";

const enabled =
  process.env.NODE_ENV === "development" ||
  process.env.CRM_PERF_TIMING === "1";

export function perfStart(label: string): () => void {
  if (!enabled) return () => undefined;
  const start = performance.now();
  return () => {
    const ms = Math.round(performance.now() - start);
    console.info(`[perf] ${label}: ${ms}ms`);
  };
}

export async function perfAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const end = perfStart(label);
  try {
    return await fn();
  } finally {
    end();
  }
}
