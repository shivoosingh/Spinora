"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import { walletTypeLabel, type WalletType } from "@/lib/wallet/types";

export interface WalletBalance {
  walletBalance: number;
  bonusWallet: number;
  cashoutWallet: number;
  bonusRedeemWallet: number;
}

export async function getMyWallet(): Promise<WalletBalance | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  return getWalletForUser(user.id);
}

export async function getWalletForUser(userId: string): Promise<WalletBalance | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (user.id !== userId) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (adminProfile?.role !== "admin") return { error: "Unauthorized" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("wallet_balance, bonus_wallet, cashout_wallet, bonus_redeem_wallet")
    .eq("id", userId)
    .single();

  if (error) {
    if (
      error.message.includes("wallet_balance") ||
      error.message.includes("bonus_wallet") ||
      error.message.includes("cashout_wallet") ||
      error.message.includes("bonus_redeem_wallet")
    ) {
      return { error: "Wallet not set up. Run supabase/redeem-wallets-and-balance-check.sql in Supabase." };
    }
    return { error: error.message };
  }

  return {
    walletBalance: Number(profile?.wallet_balance ?? 0),
    bonusWallet: Number(profile?.bonus_wallet ?? 0),
    cashoutWallet: Number(profile?.cashout_wallet ?? 0),
    bonusRedeemWallet: Number(profile?.bonus_redeem_wallet ?? 0),
  };
}

export async function creditUserWallet(
  userId: string,
  amount: number,
  walletType: WalletType,
  source: string,
  description?: string
): Promise<{ success?: boolean; error?: string }> {
  if (amount <= 0) return { error: "Invalid amount" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("credit_wallet", {
    p_user_id: userId,
    p_amount: amount,
    p_wallet_type: walletType,
    p_source: source,
    p_description: description ?? null,
  });

  if (error) {
    if (error.message.includes("credit_wallet") || error.message.includes("wallet_balance")) {
      return { error: "Wallet not set up. Run supabase/wallets.sql in Supabase." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/spin");
  revalidatePath("/");
  revalidatePath("/admin/users");

  return { success: true };
}

export async function getWalletTransactions(userId?: string, limit = 10) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let targetId = user.id;
  if (userId && userId !== user.id) {
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (adminProfile?.role !== "admin") return [];
    targetId = userId;
  }

  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export interface AdminUserBonusActivity {
  transactions: Array<{
    id: string;
    amount: number;
    wallet_type: string;
    transaction_type: string;
    source: string;
    description: string | null;
    created_at: string;
  }>;
  gameLoads: Array<{
    id: string;
    game_name: string;
    game_slug: string;
    amount: number;
    load_type: string;
    status: string;
    game_username: string | null;
    redeem_all: boolean | null;
    created_at: string;
    completed_at: string | null;
    error_message: string | null;
  }>;
}

/** Bonus-wallet debits/credits and bonus-side game jobs for admin user review. */
export async function getAdminUserBonusActivity(
  userId: string,
  limit = 50
): Promise<AdminUserBonusActivity | { error: string }> {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const [txRes, loadsRes] = await Promise.all([
    auth.supabase!
      .from("wallet_transactions")
      .select("id, amount, wallet_type, transaction_type, source, description, created_at")
      .eq("user_id", userId)
      .in("wallet_type", ["bonus", "bonus_redeem"])
      .order("created_at", { ascending: false })
      .limit(limit),
    auth.supabase!
      .from("game_load_requests")
      .select(
        "id, game_name, game_slug, amount, load_type, status, game_username, redeem_all, created_at, completed_at, error_message"
      )
      .eq("user_id", userId)
      .eq("wallet_type", "bonus")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (txRes.error?.message.includes("wallet_transactions")) {
    return { error: "Run supabase/wallets.sql in Supabase." };
  }
  if (loadsRes.error?.message.includes("game_load_requests")) {
    return { error: "Run supabase/game-load-requests.sql in Supabase." };
  }

  return {
    transactions: txRes.data ?? [],
    gameLoads: loadsRes.data ?? [],
  };
}

export async function adminGrantWallet(
  userId: string,
  amount: number,
  walletType: WalletType,
  note?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin") return { error: "Admin only" };

  const result = await creditUserWallet(
    userId,
    amount,
    walletType,
    "admin",
    note || `Admin grant to ${walletType} wallet`
  );

  if (result.success) {
    await createNotification(
      userId,
      "Wallet Updated",
      `$${amount} was added to your ${walletTypeLabel(walletType)} by an admin.`,
      "success"
    );
  }

  return result;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, supabase: null };

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin") return { error: "Admin only" as const, supabase: null };

  return { supabase, error: null };
}

function revalidateWalletPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/spin");
  revalidatePath("/");
  revalidatePath("/admin/users");
}

export async function adminDeductWallet(
  userId: string,
  amount: number,
  walletType: WalletType,
  note?: string
) {
  if (amount <= 0) return { error: "Invalid amount" };

  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const { error } = await auth.supabase!.rpc("debit_wallet", {
    p_user_id: userId,
    p_amount: amount,
    p_wallet_type: walletType,
    p_source: "admin",
    p_description: note || `Admin removed $${amount} from ${walletType} wallet`,
  });

  if (error) {
    if (error.message.includes("debit_wallet")) {
      return { error: "Run supabase/wallet-debit-reset.sql in Supabase." };
    }
    return { error: error.message };
  }

  revalidateWalletPaths();
  return { success: true };
}

export async function adminResetWallet(
  userId: string,
  walletType: WalletType,
  note?: string
) {
  const auth = await requireAdmin();
  if (auth.error) return { error: auth.error };

  const { error } = await auth.supabase!.rpc("reset_wallet", {
    p_user_id: userId,
    p_wallet_type: walletType,
    p_description: note || `${walletType} wallet reset to zero after play`,
  });

  if (error) {
    if (error.message.includes("reset_wallet")) {
      return { error: "Run supabase/wallet-debit-reset.sql in Supabase." };
    }
    return { error: error.message };
  }

  revalidateWalletPaths();
  return { success: true };
}
