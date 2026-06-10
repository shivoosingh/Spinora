import { parseInternationalPhone } from "@/lib/auth/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailIdentifier(input: string): boolean {
  return EMAIL_RE.test(input.trim().toLowerCase());
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** Parse login/register identifier — email or E.164 phone */
export function parseLoginIdentifier(input: string): { type: "email"; value: string } | { type: "phone"; value: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isEmailIdentifier(trimmed)) {
    return { type: "email", value: normalizeEmail(trimmed) };
  }

  const phone = parseInternationalPhone(trimmed);
  if (phone) return { type: "phone", value: phone };

  return null;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/** Friendlier Supabase auth errors for OTP flows */
export function formatAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "Too many codes sent. Supabase limits emails to a few per hour on the free plan — wait ~1 hour or use Continue with Google.";
  }
  if (lower.includes("confirmation mail") || lower.includes("sending confirmation") || lower.includes("magic link email")) {
    return "Could not send email. Check Supabase SMTP settings (Resend): sender email, API key, and domain verification.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "This email is already registered. Go to Sign In instead.";
  }
  return message;
}
