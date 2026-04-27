export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) {
    return undefined;
  }

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function getWhatsAppUrl(phone: string | null | undefined) {
  const normalized = normalizePhoneNumber(phone ?? "");

  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/\D/g, "");

  if (digits.length < 8) {
    return null;
  }

  return `https://wa.me/${digits}`;
}
