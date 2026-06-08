"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";

export interface WalletBalance {
  walletBalance: number;
  bonusWallet: number;
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
    .select("wallet_balance, bonus_wallet")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.message.includes("wallet_balance") || error.message.includes("bonus_wallet")) {
      return { error: "Wallet not set up. Run supabase/wallets.sql in Supabase." };
    }
    return { error: error.message };
  }

  return {
    walletBalance: Number(profile?.wallet_balance ?? 0),
    bonusWallet: Number(profile?.bonus_wallet ?? 0),
  };
}

export async function creditUserWallet(
  userId: string,
  amount: number,
  walletType: "current" | "bonus",
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

export async function adminGrantWallet(
  userId: string,
  amount: number,
  walletType: "current" | "bonus",
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
    const label = walletType === "bonus" ? "Bonus Wallet" : "Current Wallet";
    await createNotification(
      userId,
      "Wallet Updated",
      `$${amount} was added to your ${label} by an admin.`,
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
  walletType: "current" | "bonus",
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
  walletType: "current" | "bonus",
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
