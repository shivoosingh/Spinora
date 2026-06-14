import type { SupabaseClient } from "@supabase/supabase-js";

const DEPOSIT_REDEEM_MIN_MULT = 3;
const DEPOSIT_REDEEM_MAX_MULT = 8;
const MIN_PARTIAL_REDEEM = 5;
const DEPOSIT_LOAD_TYPES = ["load", "reload"] as const;

export interface DepositRolloverTotals {
  totalDepositLoads: number;
  totalDepositRedeemed: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function depositRolloverBounds(totals: DepositRolloverTotals) {
  const totalDepositLoads = roundMoney(totals.totalDepositLoads);
  const totalDepositRedeemed = roundMoney(totals.totalDepositRedeemed);
  return {
    totalDepositLoads,
    totalDepositRedeemed,
    minGameBalance: roundMoney(totalDepositLoads * DEPOSIT_REDEEM_MIN_MULT),
    maxRedeemRemaining: roundMoney(
      Math.max(0, totalDepositLoads * DEPOSIT_REDEEM_MAX_MULT - totalDepositRedeemed)
    ),
  };
}

export async function fetchDepositRolloverTotals(
  supabase: SupabaseClient,
  userId: string,
  gameSlug: string
): Promise<DepositRolloverTotals> {
  const [{ data: loads }, { data: redeems }] = await Promise.all([
    supabase
      .from("game_load_requests")
      .select("amount")
      .eq("user_id", userId)
      .eq("game_slug", gameSlug)
      .eq("wallet_type", "current")
      .in("load_type", [...DEPOSIT_LOAD_TYPES])
      .eq("status", "completed"),
    supabase
      .from("game_load_requests")
      .select("amount")
      .eq("user_id", userId)
      .eq("game_slug", gameSlug)
      .eq("wallet_type", "current")
      .eq("load_type", "redeem")
      .eq("status", "completed"),
  ]);

  const sum = (rows: { amount: number }[] | null) =>
    roundMoney((rows ?? []).reduce((acc, row) => acc + Number(row.amount ?? 0), 0));

  return {
    totalDepositLoads: sum(loads),
    totalDepositRedeemed: sum(redeems),
  };
}

function resolveDepositRedeemAmount(input: {
  gameBalance: number;
  requestedAmount: number;
  redeemAll: boolean;
  totals: DepositRolloverTotals;
}): { amount: number } | { error: string } {
  const balance = roundMoney(input.gameBalance);
  const requested = roundMoney(input.requestedAmount);
  const bounds = depositRolloverBounds(input.totals);

  if (bounds.totalDepositLoads <= 0) {
    if (input.redeemAll) {
      if (balance <= 0) return { error: "No balance to redeem" };
      return { amount: balance };
    }
    if (requested <= 0) return { error: "Amount must be positive" };
    if (requested < MIN_PARTIAL_REDEEM) {
      return { error: `Minimum redeem amount is $${MIN_PARTIAL_REDEEM}` };
    }
    if (requested > balance) {
      return { error: `Insufficient game balance ($${balance.toFixed(2)})` };
    }
    return { amount: requested };
  }

  if (balance < bounds.minGameBalance) {
    return {
      error: `Need at least $${bounds.minGameBalance.toFixed(2)} in game (${DEPOSIT_REDEEM_MIN_MULT}x your $${bounds.totalDepositLoads.toFixed(2)} deposit loads). Current balance: $${balance.toFixed(2)}.`,
    };
  }

  if (bounds.maxRedeemRemaining <= 0) {
    return {
      error: `You have reached the ${DEPOSIT_REDEEM_MAX_MULT}x redeem limit for your deposit loads.`,
    };
  }

  let amount: number;
  if (input.redeemAll) {
    amount = Math.min(balance, bounds.maxRedeemRemaining);
  } else {
    amount = requested;
    if (amount > bounds.maxRedeemRemaining) {
      return {
        error: `Maximum redeem is $${bounds.maxRedeemRemaining.toFixed(2)} (${DEPOSIT_REDEEM_MAX_MULT}x deposit loads minus prior redeems).`,
      };
    }
    if (amount > balance) {
      return { error: `Insufficient game balance ($${balance.toFixed(2)}).` };
    }
    if (amount < MIN_PARTIAL_REDEEM) {
      return { error: `Minimum redeem amount is $${MIN_PARTIAL_REDEEM}` };
    }
  }

  if (amount <= 0) return { error: "No balance to redeem" };
  return { amount: roundMoney(amount) };
}

type RedeemJob = {
  user_id: string;
  game_slug: string;
  wallet_type: string;
  amount: number;
  redeem_all?: boolean;
};

/** Bonus redeems pass through; deposit redeems enforce 3x min balance and 8x max cap. */
export async function resolveDepositRedeemForJob(
  supabase: SupabaseClient,
  job: RedeemJob,
  gameBalance: number
): Promise<number> {
  if (job.wallet_type !== "current") {
    const balance = roundMoney(gameBalance);
    if (job.redeem_all) {
      if (balance <= 0) throw new Error("No balance to redeem");
      return balance;
    }
    const amount = roundMoney(Number(job.amount));
    if (amount <= 0) throw new Error("Amount must be positive");
    if (amount > balance) {
      throw new Error(`Insufficient game balance ($${balance.toFixed(2)})`);
    }
    return amount;
  }

  const totals = await fetchDepositRolloverTotals(supabase, job.user_id, job.game_slug);
  const resolved = resolveDepositRedeemAmount({
    gameBalance,
    requestedAmount: Number(job.amount),
    redeemAll: Boolean(job.redeem_all),
    totals,
  });

  if ("error" in resolved) throw new Error(resolved.error);
  return resolved.amount;
}
