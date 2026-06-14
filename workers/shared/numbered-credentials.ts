/** Shared Spinora bot naming: always use name + number (shivoo1, shivoo2, …). */
const DEFAULT_MAX_LEN = 13;

export function profileNameStem(
  profile: { full_name?: string | null; email?: string | null },
  maxLen = DEFAULT_MAX_LEN
): string {
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

  return base.replace(/[^a-z0-9_]/g, "").slice(0, maxLen);
}

export function parseNumberedUsername(username: string): { stem: string; num: number } {
  const clean = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const match = clean.match(/^(.+?)(\d+)$/);
  if (match) {
    return { stem: match[1], num: parseInt(match[2], 10) };
  }
  return { stem: clean || "player", num: 0 };
}

export function numberedUsername(stem: string, num: number, maxLen = DEFAULT_MAX_LEN): string {
  const n = String(num);
  const room = maxLen - n.length;
  const base = stem.replace(/[^a-z0-9_]/g, "").slice(0, Math.max(1, room)) || "player";
  return `${base}${n}`;
}

export function nextNumberAfterExisting(existingUsername: string | null | undefined): number {
  if (!existingUsername?.trim()) return 1;
  const { num } = parseNumberedUsername(existingUsername.trim());
  return num > 0 ? num + 1 : 2;
}

/** @param startNum 1 = name1 first; 2 = name2 first (replace); 0 = exact name then name1, name2… */
export function usernameVariant(
  base: string,
  attempt: number,
  startNum = 1,
  maxLen = DEFAULT_MAX_LEN
): string {
  const stem = base.replace(/[^a-z0-9_]/g, "").slice(0, maxLen) || "player";
  if (startNum === 0) {
    if (attempt === 0) return stem.slice(0, maxLen);
    return numberedUsername(stem, attempt, maxLen);
  }
  return numberedUsername(stem, startNum + attempt, maxLen);
}

export interface CreateAccountPlan {
  stem: string;
  startNum: number;
  preferredPassword?: string | null;
  /** When true, never reuse an existing panel login — always pick the next free number. */
  forceNewAccount: boolean;
}

export function planCreateAccount(job: {
  game_username?: string | null;
  game_password?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  prior_game_username?: string | null;
  admin_notes?: string | null;
}): CreateAccountPlan {
  const customUser = job.game_username?.trim();
  const forceNewAccount = Boolean(
    job.prior_game_username?.trim() || job.admin_notes === "account_replace"
  );

  if (customUser) {
    const clean = customUser.slice(0, 13);
    const { stem, num } = parseNumberedUsername(clean);
    const password = job.game_password?.trim() || null;
    if (num > 0) {
      return { stem, startNum: forceNewAccount ? nextNumberAfterExisting(clean) : num, preferredPassword: password, forceNewAccount };
    }
    return {
      stem: clean.toLowerCase().replace(/[^a-z0-9_]/g, "") || "player",
      startNum: 0,
      preferredPassword: password,
      forceNewAccount,
    };
  }

  const stem = profileNameStem({
    full_name: job.requester_name,
    email: job.requester_email,
  });
  const startNum = nextNumberAfterExisting(job.prior_game_username);

  return { stem, startNum, preferredPassword: null, forceNewAccount };
}

export function variantFromPlan(plan: CreateAccountPlan, maxLen = DEFAULT_MAX_LEN) {
  return (base: string, attempt: number) =>
    usernameVariant(base, attempt, plan.startNum, maxLen);
}

export function buildCredentials(profile: {
  full_name?: string | null;
  email?: string | null;
}): { username: string; password: string } {
  const stem = profileNameStem(profile);
  const username = numberedUsername(stem, 1);
  return { username, password: username };
}
