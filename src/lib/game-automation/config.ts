import { isAutomatedGameSlug } from "@/lib/game-automation/types";

/** Server-only Juwa agent panel URL (never NEXT_PUBLIC) */
export function getJuwaAdminPanelUrl(): string | null {
  return process.env.JUWA_ADMIN_URL?.trim() || null;
}

/**
 * Vegas Sweeps agent panel URL. Defaults to the public login page so the
 * feature is enabled without extra config; override with VEGAS_ADMIN_URL.
 * (The login page URL is not secret — agent credentials live only in the worker.)
 */
export function getVegasAdminPanelUrl(): string | null {
  return process.env.VEGAS_ADMIN_URL?.trim() || "https://agent.lasvegassweeps.com/login";
}

/**
 * Game Vault agent panel URL. Defaults to the public login page so the feature
 * is enabled without extra config; override with GAMEVAULT_ADMIN_URL.
 */
export function getGameVaultAdminPanelUrl(): string | null {
  return process.env.GAMEVAULT_ADMIN_URL?.trim() || "https://agent.gamevault999.com/login";
}

export function getAutomationSecret(): string | null {
  return process.env.GAME_AUTOMATION_SECRET?.trim() || null;
}

export function isWalletLoadEnabledForGame(slug: string): boolean {
  if (!isAutomatedGameSlug(slug)) return false;
  if (slug === "juwa") return Boolean(getJuwaAdminPanelUrl());
  if (slug === "vegas-sweeps") return Boolean(getVegasAdminPanelUrl());
  if (slug === "game-vault") return Boolean(getGameVaultAdminPanelUrl());
  return false;
}

/** Wallet → game load limits (can load any balance ≥ $1 up to available) */
export const WALLET_LOAD_LIMITS = { min: 1, max: 500 } as const;
