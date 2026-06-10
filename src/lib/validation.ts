import { lossReasonRequiresBudgetFields } from "@/lib/crm-options";

export function validatePriceLossFields(
  lossReason: string | null | undefined,
  estimatedBudget: number | null | undefined,
  ourQuote: number | null | undefined
): string | null {
  if (!lossReasonRequiresBudgetFields(lossReason)) return null;
  if (estimatedBudget == null || ourQuote == null) {
    return "Для причини «Не підійшла ціна» потрібно вказати орієнтовний бюджет клієнта та наш прорахунок";
  }
  return null;
}

export function parseOptionalDecimal(
  value: string | null | undefined
): number | null {
  if (!value?.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
