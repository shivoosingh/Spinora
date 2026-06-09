"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";
import {
  WHEEL_PRIZES,
  DAILY_SPINS_BY_TIER,
  SPIN_COOLDOWN_MS,
  pickWeightedPrize,
} from "@/lib/spin/prizes";
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
  nextFreeSpinMs?: number | null;
}

export interface SpinStatus {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  nextFreeSpinMs: number | null;
}

function msUntilNextSpin(recentSpinTimes: string[], dailyLimit: number): number | null {
  if (recentSpinTimes.length < dailyLimit) return null;

  const oldestInWindow = new Date(recentSpinTimes[0]).getTime();
  const unlockAt = oldestInWindow + SPIN_COOLDOWN_MS;
  return Math.max(0, unlockAt - Date.now());
}

async function getRecentSpins(userId: string) {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - SPIN_COOLDOWN_MS).toISOString();

  const { data } = await supabase
    .from("wheel_spins")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function getSpinStatus(): Promise<SpinStatus | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("vip_tier")
    .eq("id", user.id)
    .single();

  const dailyLimit = DAILY_SPINS_BY_TIER[profile?.vip_tier || "bronze"] || 1;
  const recentSpins = await getRecentSpins(user.id);
  const usedToday = recentSpins.length;
  const remaining = Math.max(0, dailyLimit - usedToday);
  const nextFreeSpinMs =
    remaining === 0
      ? msUntilNextSpin(
          recentSpins.map((s) => s.created_at),
          dailyLimit
        )
      : null;

  return { dailyLimit, usedToday, remaining, nextFreeSpinMs };
}

export async function spinWheel(): Promise<SpinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to spin" };

  const status = await getSpinStatus();
  if ("error" in status) return { error: status.error };

  if (status.remaining <= 0) {
    const hoursLeft = status.nextFreeSpinMs
      ? Math.ceil(status.nextFreeSpinMs / (60 * 60 * 1000))
      : 24;
    return {
      error: `No spins left. Your next free spin unlocks in about ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
    };
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

    await createNotification(
      user.id,
      "Wheel Prize Won!",
      `You won ${prize.label}! $${prize.value} added to your Bonus Wallet and +${pointsToAdd} VIP points.`,
      "success"
    );
  }

  revalidatePath("/spin");
  revalidatePath("/dashboard");

  const newRemaining = status.remaining - 1;
  const nextFreeSpinMs = newRemaining <= 0 ? SPIN_COOLDOWN_MS : null;

  return {
    success: true,
    prize: {
      label: prize.label,
      type: prize.type,
      value: prize.value,
      emoji: prize.emoji,
      index,
    },
    remainingSpins: newRemaining,
    dailyLimit: status.dailyLimit,
    nextFreeSpinMs,
  };
}

export async function getSpinHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("wheel_spins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}
