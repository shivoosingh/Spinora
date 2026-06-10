/** Popular codes shown as hints only — any valid E.164 number is accepted. */
export const PHONE_EXAMPLES = [
  "+1 555 123 4567",
  "+44 7911 123456",
  "+91 98765 43210",
  "+971 50 123 4567",
  "+61 412 345 678",
  "+49 151 23456789",
  "+234 801 234 5678",
  "+92 300 1234567",
  "+880 1712 345678",
  "+81 90 1234 5678",
  "+55 11 91234 5678",
  "+52 55 1234 5678",
];

/**
 * Parse any international phone input into E.164 (+XXXXXXXX).
 * Accepts spaces, dashes, parentheses; requires country code with +.
 */
export function parseInternationalPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Digits only without + — treat as incomplete unless 10+ digits (user omitted +)
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

/** @deprecated Use parseInternationalPhone — kept for split-field fallback */
export function formatPhoneToE164(countryCode: string, localNumber: string): string | null {
  const local = localNumber.trim();
  if (local.startsWith("+")) {
    return parseInternationalPhone(local);
  }

  const codeDigits = countryCode.replace(/\D/g, "");
  const localDigits = local.replace(/\D/g, "");
  if (!codeDigits || localDigits.length < 4) return null;

  const total = codeDigits + localDigits;
  if (total.length < 8 || total.length > 15) return null;

  return `+${codeDigits}${localDigits}`;
}

export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function formatPhoneDisplay(e164: string): string {
  if (!e164.startsWith("+")) return e164;
  const digits = e164.slice(1);
  if (digits.length <= 4) return e164;
  return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
}

/** E.164 plus common stored variants (+977..., 977..., etc.) */
export function phoneLookupVariants(input: string): string[] {
  const parsed = parseInternationalPhone(input);
  if (!parsed) return [];

  const digits = parsed.replace(/\D/g, "");
  return [...new Set([parsed, `+${digits}`, digits])];
}
