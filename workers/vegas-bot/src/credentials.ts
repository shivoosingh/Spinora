/**
 * Vegas Sweeps account names: letters/numbers/underscore, 13 chars or fewer
 * (panel rule). Password defaults to the username unless the user picked one.
 */
const MAX_LEN = 13;
export function buildVegasCredentials(profile: {
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

  if (!base) base = "player";

  const username = base.replace(/[^a-z0-9_]/g, "").slice(0, MAX_LEN);
  return { username, password: username };
}

/** Login password — defaults to username when the user did not pick one. */
export function passwordForAccount(username: string, preferred?: string | null): string {
  return preferred?.trim() || username;
}

/** Random suffix from an unambiguous alphabet (no 0/o/1/l/i). */
function randomSuffix(len: number): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * The panel rejects duplicate names — and login names are unique across the
 * WHOLE platform, so common names + single-letter suffixes are often already
 * taken by other stores. Try the plain name first, then a couple of short
 * friendly suffixes, then random suffixes that almost never collide:
 *   attempt 0    -> base
 *   attempt 1..2 -> base + digit (base1, base2)
 *   attempt 3..5 -> base + 2 random chars
 *   attempt 6+   -> base + 3 random chars
 */
export function usernameVariant(base: string, attempt: number): string {
  const clean = base.replace(/[^a-z0-9_]/g, "").slice(0, MAX_LEN) || "player";
  if (attempt <= 0) return clean;

  let suffix: string;
  if (attempt <= 2) suffix = String(attempt);
  else suffix = randomSuffix(attempt <= 5 ? 2 : 3);

  const room = MAX_LEN - suffix.length;
  return `${clean.slice(0, Math.max(1, room))}${suffix}`;
}
