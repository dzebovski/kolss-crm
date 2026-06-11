export function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v.trim();
}

export function checkbox(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function filesFromFormData(
  fd: FormData,
  key = "attachments"
): File[] {
  return fd
    .getAll(key)
    .filter((f): f is File => f instanceof File && f.size > 0);
}
