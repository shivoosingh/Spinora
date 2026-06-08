"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WHEEL_PRIZES, DAILY_SPINS_BY_TIER, pickWeightedPrize } from "@/lib/spin/prizes";
import { creditUserWallet } from "@/lib/actions/wallet";

export interface SpinResult {
  success?: boolean;
  error?: string;
  prize?: {
    label: string;
    type: string;
    value: number;
    emoji: string;
    index: number;
  };
  remainingSpins?: number;
  dailyLimit?: number;
}

export interface SpinStatus {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  nextFreeSpinMs: number | null;
}

export async function getSpinStatus(): Promise<SpinStatus | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("vip_tier")
    .eq("id", user.id)
    .single();

  const dailyLimit = DAILY_SPINS_BY_TIER[profile?.vip_tier || "bronze"] || 1;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("wheel_spins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());

  const usedToday = count || 0;
  const remaining = Math.max(0, dailyLimit - usedToday);

  const { data: lastSpin } = await supabase
    .from("wheel_spins")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextFreeSpinMs: number | null = null;
  if (remaining === 0) {
    const tomorrow = new Date(startOfDay);
    tomorrow.setDate(tomorrow.getDate() + 1);
    nextFreeSpinMs = tomorrow.getTime() - Date.now();
  }

  return { dailyLimit, usedToday, remaining, nextFreeSpinMs };
}

export async function spinWheel(): Promise<SpinResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to spin" };

  const status = await getSpinStatus();
  if ("error" in status) return { error: status.error };
  if (status.remaining <= 0) {
    return { error: "No spins remaining today. Come back tomorrow!" };
  }

  const { prize, index } = pickWeightedPrize();

  const { error } = await supabase.from("wheel_spins").insert({
    user_id: user.id,
    prize_label: prize.label,
    prize_type: prize.type,
    prize_value: prize.value,
  });

  if (error) {
    if (error.message.includes("wheel_spins")) {
      return { error: "Wheel system not set up. Run supabase/wheel-spins.sql in Supabase." };
    }
    return { error: error.message };
  }

  if (prize.type === "cash" && prize.value > 0) {
    const pointsToAdd = prize.value * 10;
    const { data: profile } = await supabase
      .from("profiles")
      .select("vip_points")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ vip_points: profile.vip_points + pointsToAdd })
        .eq("id", user.id);
    }

    await creditUserWallet(
      user.id,
      prize.value,
      "bonus",
      "spin",
      `Wheel prize: ${prize.label}`
    );

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Wheel Prize Won!",
      message: `You won ${prize.label}! $${prize.value} added to your Bonus Wallet and +${pointsToAdd} VIP points.`,
      type: "success",
    });
  }

  revalidatePath("/spin");
  revalidatePath("/dashboard");

  return {
    success: true,
    prize: {
      label: prize.label,
      type: prize.type,
      value: prize.value,
      emoji: prize.emoji,
      index,
    },
    remainingSpins: status.remaining - 1,
    dailyLimit: status.dailyLimit,
  };
}

export async function getSpinHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("wheel_spins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}
