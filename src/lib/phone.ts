export function normalizePhoneForOffice(
  raw: string | null | undefined,
  officeCode: string
): string | null {
  if (!raw?.trim()) return null;

  let digits = raw.replace(/^p:/i, "").replace(/\D/g, "");
  if (!digits) return null;

  if (officeCode === "warsaw") {
    return formatPolishPhone(digits);
  }

  return formatUkrainianPhone(digits);
}

function formatUkrainianPhone(digits: string): string | null {
  if (digits.startsWith("380")) digits = digits.slice(3);
  else if (digits.startsWith("38")) digits = digits.slice(2);

  if (digits.length === 9 && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }

  if (digits.length > 10) digits = digits.slice(-10);
  if (digits.length !== 10 || !digits.startsWith("0")) {
    return `+38 ${digits}`;
  }

  return `+38 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

function formatPolishPhone(digits: string): string | null {
  if (digits.startsWith("48")) digits = digits.slice(2);
  if (digits.length > 9) digits = digits.slice(-9);
  if (digits.length !== 9) {
    return `+48 ${digits}`;
  }
  return `+48 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

export function formatPhoneDisplay(
  phone: string | null | undefined,
  officeCode: string | undefined
): string {
  if (!phone?.trim()) return "—";
  const code = officeCode === "warsaw" ? "warsaw" : "kyiv";
  return normalizePhoneForOffice(phone, code) ?? phone;
}
