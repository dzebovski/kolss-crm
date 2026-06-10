export function hasActiveCallbackReminder(
  callbackDueAt: string | null | undefined
): boolean {
  return callbackDueAt != null;
}
