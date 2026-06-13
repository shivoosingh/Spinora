/**
 * MR All In One panel rules:
 * - Username: letters, numbers, underscore, 6–13 chars
 * - Password: letters and numbers ONLY (no underscore/symbols), 6–13 chars
 */
const MIN_LEN = 6;
const MAX_LEN = 13;

function cleanUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/** Password must be alphanumeric only — panel rejects underscores and symbols. */
function cleanPassword(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** MR All In One rejects letter-only or digit-only passwords — must include both. */
function finalizePassword(raw: string): string {
  let p = cleanPassword(raw);
  if (p.length < MIN_LEN) p = `${p}123456789`.slice(0, MAX_LEN);
  if (p.length < MIN_LEN) p = "player1";
  if (!/[0-9]/.test(p)) p = `${p}1`.slice(0, MAX_LEN);
  if (!/[a-z]/.test(p)) p = `a${p}`.slice(0, MAX_LEN);
  if (p.length < MIN_LEN) p = "player1";
  return p.slice(0, MAX_LEN);
}

function padPassword(base: string): string {
  return finalizePassword(base);
}

/** Pad or trim so the panel accepts the value (6–13 chars). */
export function normalizeUsername(raw: string): string {
  let u = cleanUsername(raw).slice(0, MAX_LEN);
  if (!u) u = "player";
  if (u.length < MIN_LEN) {
    u = `${u}123456`.slice(0, MAX_LEN);
    if (u.length < MIN_LEN) u = "player1";
  }
  return u;
}

/** Password for a given login name — always 6–13 alphanumeric chars with letters AND digits. */
export function passwordForAccount(username: string, preferred?: string): string {
  const fallback = finalizePassword(`${cleanPassword(username) || "player"}1`);
  if (!preferred?.trim()) return fallback;

  const p = cleanPassword(preferred);
  if (p.length >= MIN_LEN) return finalizePassword(p);
  return fallback;
}

export function buildCredentials(profile: {
  full_name?: string | null;
  email?: string | null;
}): { username: string; password: string } {
  let base = "";

  if (profile.full_name?.trim()) {
    const parts = profile.full_name.trim().split(/\s+/);
    base = parts[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (base.length < 3 && parts.length > 1) {
      base = parts
        .join("_")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_");
    }
  }

  if (!base && profile.email) {
    const local = profile.email.split("@")[0] ?? "";
    if (!local.endsWith("@phone.spinora.local")) {
      base = local.toLowerCase().replace(/[^a-z0-9_]/g, "");
    }
  }

  const username = normalizeUsername(base || "player");
  return { username, password: passwordForAccount(username) };
}

/** Random suffix from an unambiguous alphabet (no 0/o/1/l/i). */
function randomSuffix(len: number): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function usernameVariant(base: string, attempt: number): string {
  const clean = normalizeUsername(base);
  if (attempt <= 0) return clean;

  let suffix: string;
  if (attempt <= 2) suffix = String(attempt);
  else suffix = randomSuffix(attempt <= 5 ? 2 : 3);

  const room = MAX_LEN - suffix.length;
  const variant = `${clean.slice(0, Math.max(1, room))}${suffix}`;
  return normalizeUsername(variant);
}
