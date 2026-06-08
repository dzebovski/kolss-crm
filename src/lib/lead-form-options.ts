export type SelectOption = {
  code: string;
  labelUk: string;
  labelPl: string;
};

export const PRODUCT_INTEREST_OPTIONS: SelectOption[] = [
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

export const PROJECT_STAGE_OPTIONS: SelectOption[] = [
  {
    code: "new_no_project",
    labelUk: "Новий, проекту немає",
    labelPl: "Nowy, brak projektu",
  },
  {
    code: "project_estimate",
    labelUk: "Проект є, оцінка",
    labelPl: "Projekt jest, wycena",
  },
  { code: "other", labelUk: "Інше", labelPl: "Inne" },
];

export function optionLabel(
  option: SelectOption,
  officeCode: string | undefined
): string {
  return officeCode === "warsaw" ? option.labelPl : option.labelUk;
}

export function labelForCode(
  options: SelectOption[],
  code: string | null | undefined,
  officeCode: string | undefined
): string {
  if (!code) return "—";
  const found = options.find((o) => o.code === code);
  if (!found) return code;
  return optionLabel(found, officeCode);
}

export function formLabels(officeCode: string | undefined) {
  const pl = officeCode === "warsaw";
  return {
    block1: pl ? "Blok 1: Zamówienie" : "Блок 1: Замовлення",
    product: pl ? "Co zamawia" : "Що замовляє",
    orderComment: pl ? "Komentarz do zamówienia" : "Коментар до замовлення",
    block2: pl ? "Blok 2: Etap projektu" : "Блок 2: Етап проєкту",
    projectStage: pl ? "Etap projektu" : "Етап проєкту",
    stageComment: pl ? "Komentarz do etapu" : "Коментар до етапу",
    attachments: pl ? "Załączniki" : "Файли",
    attachmentsHint: pl
      ? "PDF, JPG, PNG, DOCX, XLSX — do 5 MB każdy"
      : "PDF, JPG, PNG, DOCX, XLSX — до 5 МБ кожен",
    selectPlaceholder: pl ? "Wybierz…" : "Оберіть…",
    leadDateTime: pl ? "Data i godzina leadu" : "Дата і час ліда",
    leadDateTimeHint: pl
      ? "Domyślnie teraz — zmień, jeśli wprowadzasz lead z datą wsteczną"
      : "За замовчуванням зараз — змініть, якщо заносите лід заднім числом",
  };
}
