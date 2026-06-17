"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";
import { notifyAdminOfWalletActivity } from "@/lib/telegram/notify-admin-wallet-activity";
import { getJuwaAdminPanelUrl, getVegasAdminPanelUrl, getGameVaultAdminPanelUrl, getCashFrenzyAdminPanelUrl, isWalletLoadEnabledForGame, WALLET_LOAD_LIMITS } from "@/lib/game-automation/config";
import { ensureGameAccountUsername, maxUsernameLenForGame } from "@/lib/game-automation/account-username";
import type { GameLoadWalletType } from "@/lib/game-automation/types";
import {
  depositRolloverBounds,
  DEPOSIT_LOAD_TYPES,
  type DepositRolloverBounds,
} from "@/lib/wallet/deposit-redeem-rollover";
import {
  bonusRolloverBounds,
  BONUS_LOAD_TYPES,
  type BonusRolloverBounds,
} from "@/lib/wallet/bonus-redeem-rollover";

export async function requestGameAccountCreate(input: {
  gameSlug: string;
  gameName: string;
  username?: string;
  password?: string;
  /** Required when the user already has completed game credentials for this slug. */
  replaceAccount?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isWalletLoadEnabledForGame(input.gameSlug)) {
    return { error: "Wallet load is not enabled for this game yet." };
  }

  // Fail jobs stuck in pending/processing (no-op if SQL migration not applied yet).
  await supabase.rpc("fail_stale_game_loads", {
    p_stale_minutes: 5,
    p_user_id: user.id,
    p_game_slug: input.gameSlug,
  });

  const existing = await getMyGameAccount(input.gameSlug);
  const hasAccount = Boolean(existing?.game_username);

  if (hasAccount && !input.replaceAccount) {
    return {
      error: "You already have a game account. Use Replace Account to get new login details.",
    };
  }

  if (!hasAccount && input.replaceAccount) {
    return { error: "No account to replace yet. Create your first account instead." };
  }

  const rawUsername = input.username?.trim() || undefined;
  const password = input.password?.trim() || undefined;

  if (rawUsername || password) {
    if (!rawUsername || rawUsername.length < 3) {
      return { error: "Username must be at least 3 characters." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(rawUsername)) {
      return { error: "Username can only contain letters, numbers, and underscores." };
    }
    if (rawUsername.length > maxUsernameLenForGame(input.gameSlug)) {
      return { error: `Username must be at most ${maxUsernameLenForGame(input.gameSlug)} characters.` };
    }
    if (!password || password.length < 4) {
      return { error: "Password must be at least 4 characters." };
    }
  }

  const username = rawUsername
    ? ensureGameAccountUsername(rawUsername, input.gameSlug)
    : undefined;

  const { data: pending } = await supabase
    .from("game_load_requests")
    .select("id, load_type")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (pending) {
    return {
      error:
        "A request is already in progress. Cancel the stuck item under Recent activity below, then try Replace again.",
    };
  }

  const { data: requestId, error } = await supabase.rpc("request_game_account_create", {
    p_game_slug: input.gameSlug,
    p_game_name: input.gameName,
    p_username: username ?? null,
    p_password: password ?? null,
    p_replace: input.replaceAccount ?? false,
  });

  if (error) {
    if (error.message.includes("request_game_account_create")) {
      return { error: "Run supabase/redeem-wallets-and-balance-check.sql in Supabase SQL Editor first." };
    }
    if (error.message.includes("already have a game account")) {
      return { error: error.message };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/admin/game-loads");

  await notifyAdminOfWalletActivity({
    userId: user.id,
    gameName: input.gameName,
    gameSlug: input.gameSlug,
    kind: "create_account",
    requestId: requestId as string,
  });

  return { success: true, requestId: requestId as string };
}

export async function requestGameCheckBalance(input: {
  gameSlug: string;
  gameName: string;
  gameUsername: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isWalletLoadEnabledForGame(input.gameSlug)) {
    return { error: "Wallet load is not enabled for this game yet." };
  }

  if (!input.gameUsername?.trim()) {
    return { error: "Create your game account first." };
  }

  const { data: pending } = await supabase
    .from("game_load_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (pending) {
    return { error: "You already have a request in progress for this game." };
  }

  const { data: requestId, error } = await supabase.rpc("request_game_check_balance", {
    p_game_slug: input.gameSlug,
    p_game_name: input.gameName,
    p_game_username: input.gameUsername.trim(),
  });

  if (error) {
    if (error.message.includes("request_game_check_balance")) {
      return { error: "Run supabase/redeem-wallets-and-balance-check.sql in Supabase SQL Editor first." };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/admin/game-loads");
  return { success: true, requestId: requestId as string };
}

export async function requestGameLoad(input: {
  gameSlug: string;
  gameName: string;
  amount: number;
  walletType: GameLoadWalletType;
  gameUsername: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isWalletLoadEnabledForGame(input.gameSlug)) {
    return { error: "Wallet load is not enabled for this game yet." };
  }

  const amount = Math.round(input.amount * 100) / 100;
  if (amount < WALLET_LOAD_LIMITS.min || amount > WALLET_LOAD_LIMITS.max) {
    return {
      error: `Amount must be between $${WALLET_LOAD_LIMITS.min} and $${WALLET_LOAD_LIMITS.max}`,
    };
  }

  if (!input.gameUsername?.trim()) {
    return { error: "Create your game account first." };
  }

  const { data: pending } = await supabase
    .from("game_load_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (pending) {
    return { error: "You already have a request in progress for this game." };
  }

  const { data: requestId, error } = await supabase.rpc("request_game_load", {
    p_game_slug: input.gameSlug,
    p_game_name: input.gameName,
    p_amount: amount,
    p_wallet_type: input.walletType,
    p_load_type: "load",
    p_game_username: input.gameUsername.trim(),
  });

  if (error) {
    if (error.message.includes("request_game_load")) {
      return { error: "Run supabase/game-load-requests.sql in Supabase SQL Editor first." };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/game-loads");

  await notifyAdminOfWalletActivity({
    userId: user.id,
    gameName: input.gameName,
    gameSlug: input.gameSlug,
    kind: "load",
    amount,
    walletType: input.walletType,
    requestId: requestId as string,
  });

  return { success: true, requestId: requestId as string };
}

export async function requestGameRedeem(input: {
  gameSlug: string;
  gameName: string;
  amount?: number;
  redeemAll?: boolean;
  gameUsername: string;
  walletType?: GameLoadWalletType;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isWalletLoadEnabledForGame(input.gameSlug)) {
    return { error: "Wallet load is not enabled for this game yet." };
  }

  const redeemAll = Boolean(input.redeemAll);

  if (!redeemAll) {
    const amount = Math.round((input.amount ?? 0) * 100) / 100;
    if (amount < WALLET_LOAD_LIMITS.min || amount > WALLET_LOAD_LIMITS.max) {
      return {
        error: `Enter $${WALLET_LOAD_LIMITS.min}–$${WALLET_LOAD_LIMITS.max}`,
      };
    }
  }

  if (!input.gameUsername?.trim()) {
    return { error: "Create your game account first." };
  }

  const walletType = input.walletType ?? "current";

  if (walletType === "current") {
    const rollover = await fetchActiveDepositRolloverForUser(supabase, user.id, input.gameSlug);
    const bounds = depositRolloverBounds(rollover);

    if (bounds.activeDepositAmount > 0) {
      const lastBalance = await fetchLastGameBalanceForUser(supabase, user.id, input.gameSlug);

      if (lastBalance === null) {
        return {
          error: `Check your live game balance first — you need at least $${bounds.minGameBalance.toFixed(2)} in game (3x your $${bounds.activeDepositAmount.toFixed(2)} deposit) to redeem.`,
        };
      }

      if (lastBalance < bounds.minGameBalance) {
        return {
          error: `Need at least $${bounds.minGameBalance.toFixed(2)} in game (3x your $${bounds.activeDepositAmount.toFixed(2)} deposit). Last checked: $${lastBalance.toFixed(2)}.`,
        };
      }

      if (bounds.maxRedeemRemaining <= 0) {
        return { error: "You have reached the 8x redeem limit for this deposit." };
      }

      if (!redeemAll) {
        const amount = Math.round((input.amount ?? 0) * 100) / 100;
        if (amount > bounds.maxRedeemRemaining) {
          return {
            error: `Maximum redeem is $${bounds.maxRedeemRemaining.toFixed(2)} (8x this deposit minus prior redeems).`,
          };
        }
      }
    }
  } else if (walletType === "bonus") {
    const rollover = await fetchActiveBonusRolloverForUser(supabase, user.id, input.gameSlug);
    const bounds = bonusRolloverBounds(rollover);

    if (bounds.activeDepositAmount > 0) {
      const lastBalance = await fetchLastGameBalanceForUser(supabase, user.id, input.gameSlug);

      if (lastBalance === null) {
        return {
          error: `Check your live game balance first — you need at least $${bounds.minGameBalance.toFixed(2)} in game (7x your $${bounds.activeDepositAmount.toFixed(2)} bonus load) to redeem.`,
        };
      }

      if (lastBalance < bounds.minGameBalance) {
        return {
          error: `Need at least $${bounds.minGameBalance.toFixed(2)} in game (7x your $${bounds.activeDepositAmount.toFixed(2)} bonus load). Last checked: $${lastBalance.toFixed(2)}.`,
        };
      }

      if (bounds.maxRedeemRemaining <= 0) {
        return { error: "You have reached the 15x redeem limit for this bonus load." };
      }

      if (!redeemAll) {
        const amount = Math.round((input.amount ?? 0) * 100) / 100;
        if (amount > bounds.maxRedeemRemaining) {
          return {
            error: `Maximum redeem is $${bounds.maxRedeemRemaining.toFixed(2)} (15x this bonus load minus prior redeems).`,
          };
        }
      }
    }
  }

  const { data: pending } = await supabase
    .from("game_load_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (pending) {
    return { error: "You already have a request in progress for this game." };
  }

  const { data: requestId, error } = await supabase.rpc("request_game_redeem", {
    p_game_slug: input.gameSlug,
    p_game_name: input.gameName,
    p_amount: redeemAll ? 0 : input.amount,
    p_game_username: input.gameUsername.trim(),
    p_redeem_all: redeemAll,
    p_wallet_type: walletType,
  });

  if (error) {
    if (error.message.includes("request_game_redeem")) {
      return {
        error: "Run supabase/deposit-redeem-rollover.sql and supabase/bonus-redeem-rollover.sql in Supabase SQL Editor first.",
      };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/game-loads");

  await notifyAdminOfWalletActivity({
    userId: user.id,
    gameName: input.gameName,
    gameSlug: input.gameSlug,
    kind: "redeem",
    amount: redeemAll ? null : input.amount,
    walletType,
    redeemAll,
    requestId: requestId as string,
  });

  return { success: true, requestId: requestId as string };
}

async function fetchActiveDepositRolloverForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gameSlug: string
) {
  const { data, error } = await supabase.rpc("get_deposit_rollover_totals", {
    p_user_id: userId,
    p_game_slug: gameSlug,
  });

  if (!error && data?.length) {
    const row = data[0] as {
      active_load_amount?: number;
      redeemed_since_active?: number;
      total_loads?: number;
      total_redeemed?: number;
    };
    return {
      activeDepositAmount: Number(
        row.active_load_amount ?? row.total_loads ?? 0
      ),
      redeemedSinceActiveDeposit: Number(
        row.redeemed_since_active ?? row.total_redeemed ?? 0
      ),
    };
  }

  return fetchActiveWalletRolloverFallback(
    supabase,
    userId,
    gameSlug,
    "current",
    DEPOSIT_LOAD_TYPES
  );
}

async function fetchActiveBonusRolloverForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gameSlug: string
) {
  const { data, error } = await supabase.rpc("get_bonus_rollover_totals", {
    p_user_id: userId,
    p_game_slug: gameSlug,
  });

  if (!error && data?.length) {
    const row = data[0] as {
      active_load_amount?: number;
      redeemed_since_active?: number;
    };
    return {
      activeBonusLoadAmount: Number(row.active_load_amount ?? 0),
      redeemedSinceActiveBonusLoad: Number(row.redeemed_since_active ?? 0),
    };
  }

  const fallback = await fetchActiveWalletRolloverFallback(
    supabase,
    userId,
    gameSlug,
    "bonus",
    BONUS_LOAD_TYPES
  );

  return {
    activeBonusLoadAmount: fallback.activeDepositAmount,
    redeemedSinceActiveBonusLoad: fallback.redeemedSinceActiveDeposit,
  };
}

async function fetchActiveWalletRolloverFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gameSlug: string,
  walletType: "current" | "bonus",
  loadTypes: readonly string[]
) {
  const { data: latestLoad } = await supabase
    .from("game_load_requests")
    .select("amount, completed_at")
    .eq("user_id", userId)
    .eq("game_slug", gameSlug)
    .eq("wallet_type", walletType)
    .in("load_type", [...loadTypes])
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestLoad) {
    return { activeDepositAmount: 0, redeemedSinceActiveDeposit: 0 };
  }

  let redeemQuery = supabase
    .from("game_load_requests")
    .select("amount")
    .eq("user_id", userId)
    .eq("game_slug", gameSlug)
    .eq("wallet_type", walletType)
    .eq("load_type", "redeem")
    .eq("status", "completed");

  if (latestLoad.completed_at) {
    redeemQuery = redeemQuery.gte("completed_at", latestLoad.completed_at);
  }

  const { data: redeems } = await redeemQuery;

  const sum = (rows: { amount: number }[] | null) =>
    Math.round((rows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0) * 100) / 100;

  return {
    activeDepositAmount: Math.round(Number(latestLoad.amount ?? 0) * 100) / 100,
    redeemedSinceActiveDeposit: sum(redeems),
  };
}

async function fetchLastGameBalanceForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  gameSlug: string
): Promise<number | null> {
  const { data } = await supabase
    .from("game_load_requests")
    .select("amount")
    .eq("user_id", userId)
    .eq("game_slug", gameSlug)
    .eq("load_type", "check_balance")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return Math.round(Number(data.amount ?? 0) * 100) / 100;
}

export async function getDepositRolloverForGame(
  gameSlug: string
): Promise<DepositRolloverBounds | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rollover = await fetchActiveDepositRolloverForUser(supabase, user.id, gameSlug);
  return depositRolloverBounds(rollover);
}

export async function getBonusRolloverForGame(
  gameSlug: string
): Promise<BonusRolloverBounds | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rollover = await fetchActiveBonusRolloverForUser(supabase, user.id, gameSlug);
  return bonusRolloverBounds(rollover);
}

export async function getMyGameLoads(gameSlug?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("game_load_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (gameSlug) query = query.eq("game_slug", gameSlug);

  const { data } = await query;
  return data ?? [];
}

export async function getMyGameAccount(gameSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("game_load_requests")
    .select("game_username, game_password, status, completed_at")
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .eq("status", "completed")
    .in("load_type", ["create_account", "new_account"])
    .not("game_username", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/** Fail pending/processing jobs older than N minutes (frees blocked Replace / Load clicks). */
export async function healStaleGameLoads(gameSlug: string, staleMinutes = 15) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { healed: 0 };

  const { data, error } = await supabase.rpc("fail_stale_game_loads", {
    p_stale_minutes: staleMinutes,
    p_user_id: user.id,
    p_game_slug: gameSlug,
  });

  if (!error) return { healed: Number(data ?? 0) };

  const admin = createAdminClient();
  if (!admin) return { healed: 0 };

  const now = Date.now();
  const cutoff = new Date(now - staleMinutes * 60 * 1000).toISOString();
  const oldProcessingCutoff = new Date(now - 30 * 60 * 1000).toISOString();

  const { data: oldRows } = await admin
    .from("game_load_requests")
    .update({
      status: "failed",
      error_message:
        "This request got stuck (bot did not finish). Refresh, then click Replace Account again.",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .eq("status", "processing")
    .lt("created_at", oldProcessingCutoff)
    .select("id");

  const { data: rows } = await admin
    .from("game_load_requests")
    .update({
      status: "failed",
      error_message:
        "Timed out waiting for the game bot. Restart the bot on your PC, then try Replace again.",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("game_slug", gameSlug)
    .in("status", ["pending", "processing"])
    .lt("updated_at", cutoff)
    .select("id");

  return { healed: (rows?.length ?? 0) + (oldRows?.length ?? 0) };
}

export async function cancelMyGameLoad(requestId: string, gameSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("cancel_my_game_load", {
    p_request_id: requestId,
  });

  if (!error) {
    revalidatePath(`/games/${gameSlug}`);
    revalidatePath("/admin/game-loads");
    return { success: true };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        error.message.includes("cancel_my_game_load")
          ? "Run supabase/stale-game-load-recovery.sql in Supabase, or ask admin to cancel the stuck job."
          : error.message,
    };
  }

  const { data: rows, error: updErr } = await admin
    .from("game_load_requests")
    .update({
      status: "cancelled",
      error_message: "Cancelled — you can start a new request.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"])
    .select("id");

  if (updErr || !rows?.length) {
    return { error: updErr?.message ?? "Request not found or already finished" };
  }

  revalidatePath(`/games/${gameSlug}`);
  revalidatePath("/admin/game-loads");
  return { success: true };
}

export async function getAdminPanelUrlForGame(gameSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  if (gameSlug === "juwa") {
    const url = getJuwaAdminPanelUrl();
    if (!url) return { error: "JUWA_ADMIN_URL not configured" };
    return { url };
  }

  if (gameSlug === "vegas-sweeps") {
    const url = getVegasAdminPanelUrl();
    if (!url) return { error: "VEGAS_ADMIN_URL not configured" };
    return { url };
  }

  if (gameSlug === "game-vault") {
    const url = getGameVaultAdminPanelUrl();
    if (!url) return { error: "GAMEVAULT_ADMIN_URL not configured" };
    return { url };
  }

  if (gameSlug === "cash-frenzy") {
    const url = getCashFrenzyAdminPanelUrl();
    if (!url) return { error: "CASHFRENZY_ADMIN_URL not configured" };
    return { url };
  }

  return { error: "No admin panel configured for this game" };
}

export async function adminUpdateGameLoadStatus(
  requestId: string,
  status: "completed" | "failed" | "cancelled",
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("game_load_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!existing) return { error: "Request not found" };

  const { error } = await supabase
    .from("game_load_requests")
    .update({
      status,
      admin_notes: notes ?? existing.admin_notes,
      completed_at: status === "completed" ? new Date().toISOString() : existing.completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  if (status === "completed") {
    const isRedeem = existing.load_type === "redeem";
    await createNotification(
      existing.user_id,
      isRedeem ? `${existing.game_name} redeem complete` : `${existing.game_name} load complete`,
      isRedeem
        ? `$${Number(existing.amount).toFixed(2)} was redeemed to your Spinora wallet.`
        : `$${Number(existing.amount).toFixed(2)} was loaded to your ${existing.game_name} account.`,
      "success"
    );
  }

  if (status === "failed" || status === "cancelled") {
    await createNotification(
      existing.user_id,
      `${existing.game_name} load update`,
      `Your load request could not be completed. Contact support for help.`,
      "warning"
    );
  }

  revalidatePath("/admin/game-loads");
  return { success: true };
}
