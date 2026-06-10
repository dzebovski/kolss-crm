import type { SelectOption } from "@/lib/lead-form-options";
import { optionLabel } from "@/lib/lead-form-options";

export const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { code: "kitchen", labelUk: "Кухня", labelPl: "Kuchnia" },
  {
    code: "home_furniture",
    labelUk: "Меблі для дому",
    labelPl: "Meble do domu",
  },
  {
    code: "wardrobe",
    labelUk: "Шафа / Гардероб",
    labelPl: "Szafa / Garderoba",
  },
  { code: "other", labelUk: "Інше", labelPl: "Inne" },
];

export const LOSS_REASON_OPTIONS: SelectOption[] = [
  { code: "spam", labelUk: "Сміття / Спам", labelPl: "Spam" },
  { code: "not_target", labelUk: "Нецільовий", labelPl: "Niecelowy" },
  {
    code: "price",
    labelUk: "Не підійшла ціна",
    labelPl: "Cena nie pasuje",
  },
];

export const PROJECT_DOCUMENT_TYPES = ["contract", "act", "other"] as const;
export type ProjectDocumentType = (typeof PROJECT_DOCUMENT_TYPES)[number];

export function productDetailsRequired(productType: string | null | undefined) {
  return productType === "home_furniture" || productType === "other";
}

export function lossReasonRequiresBudgetFields(
  lossReason: string | null | undefined
) {
  return lossReason === "price";
}

export function labelForCrmCode(
  options: SelectOption[],
  code: string | null | undefined,
  officeCode: string | undefined
): string {
  if (!code) return "—";
  const found = options.find((o) => o.code === code);
  if (!found) return code;
  return optionLabel(found, officeCode);
}
