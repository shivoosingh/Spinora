"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { getJuwaAdminPanelUrl, getVegasAdminPanelUrl, getGameVaultAdminPanelUrl, isWalletLoadEnabledForGame, WALLET_LOAD_LIMITS } from "@/lib/game-automation/config";
import type { GameLoadWalletType } from "@/lib/game-automation/types";

export async function requestGameAccountCreate(input: {
  gameSlug: string;
  gameName: string;
  username?: string;
  password?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!isWalletLoadEnabledForGame(input.gameSlug)) {
    return { error: "Wallet load is not enabled for this game yet." };
  }

  const username = input.username?.trim() || undefined;
  const password = input.password?.trim() || undefined;

  if (username || password) {
    if (!username || username.length < 3) {
      return { error: "Username must be at least 3 characters." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { error: "Username can only contain letters, numbers, and underscores." };
    }
    if (!password || password.length < 4) {
      return { error: "Password must be at least 4 characters." };
    }
  }

  const { data: pending } = await supabase
    .from("game_load_requests")
    .select("id, load_type")
    .eq("user_id", user.id)
    .eq("game_slug", input.gameSlug)
    .in("status", ["pending", "processing"])
    .maybeSingle();

  if (pending) {
    return { error: "A request is already in progress. Please wait." };
  }

  const { data: requestId, error } = await supabase.rpc("request_game_account_create", {
    p_game_slug: input.gameSlug,
    p_game_name: input.gameName,
    p_username: username ?? null,
    p_password: password ?? null,
  });

  if (error) {
    if (error.message.includes("request_game_account_create")) {
      return { error: "Run supabase/redeem-wallets-and-balance-check.sql in Supabase SQL Editor first." };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/admin/game-loads");
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
    p_wallet_type: input.walletType ?? "current",
  });

  if (error) {
    if (error.message.includes("request_game_redeem")) {
      return { error: "Run supabase/game-load-redeem.sql in Supabase SQL Editor first." };
    }
    return { error: error.message };
  }

  revalidatePath(`/games/${input.gameSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/game-loads");

  return { success: true, requestId: requestId as string };
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
