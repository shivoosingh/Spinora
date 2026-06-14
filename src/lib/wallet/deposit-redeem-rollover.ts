import { GAME_BONUS_RULES } from "@/lib/games";
import { WALLET_LOAD_LIMITS } from "@/lib/game-automation/config";

export const DEPOSIT_REDEEM_MIN_MULT = GAME_BONUS_RULES.redeemMin;
export const DEPOSIT_REDEEM_MAX_MULT = GAME_BONUS_RULES.redeemMax;

/** Completed game_load_requests rows that count toward deposit rollover. */
export const DEPOSIT_LOAD_TYPES = ["load", "reload"] as const;

export interface DepositRolloverTotals {
  totalDepositLoads: number;
  totalDepositRedeemed: number;
}

export interface DepositRolloverBounds extends DepositRolloverTotals {
  minGameBalance: number;
  maxRedeemRemaining: number;
}

export function depositRolloverBounds(totals: DepositRolloverTotals): DepositRolloverBounds {
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

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export type DepositRedeemResolution =
  | { ok: true; amount: number }
  | { ok: false; error: string };

/** Resolve redeem amount for deposit-wallet redeems (3x min balance, 8x max cap). */
export function resolveDepositRedeemAmount(input: {
  gameBalance: number;
  requestedAmount: number;
  redeemAll: boolean;
  totals: DepositRolloverTotals;
}): DepositRedeemResolution {
  const balance = roundMoney(input.gameBalance);
  const requested = roundMoney(input.requestedAmount);
  const bounds = depositRolloverBounds(input.totals);

  if (bounds.totalDepositLoads <= 0) {
    if (input.redeemAll) {
      if (balance <= 0) return { ok: false, error: "No balance to redeem" };
      return { ok: true, amount: balance };
    }
    if (requested <= 0) return { ok: false, error: "Amount must be positive" };
    if (requested < WALLET_LOAD_LIMITS.min) {
      return { ok: false, error: `Minimum redeem amount is $${WALLET_LOAD_LIMITS.min}` };
    }
    if (requested > balance) {
      return { ok: false, error: `Insufficient game balance ($${balance.toFixed(2)})` };
    }
    return { ok: true, amount: requested };
  }

  if (balance < bounds.minGameBalance) {
    return {
      ok: false,
      error: `Need at least $${bounds.minGameBalance.toFixed(2)} in game (${DEPOSIT_REDEEM_MIN_MULT}x your $${bounds.totalDepositLoads.toFixed(2)} deposit loads). Current balance: $${balance.toFixed(2)}.`,
    };
  }

  if (bounds.maxRedeemRemaining <= 0) {
    return {
      ok: false,
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
        ok: false,
        error: `Maximum redeem is $${bounds.maxRedeemRemaining.toFixed(2)} (${DEPOSIT_REDEEM_MAX_MULT}x deposit loads minus prior redeems).`,
      };
    }
    if (amount > balance) {
      return {
        ok: false,
        error: `Insufficient game balance ($${balance.toFixed(2)}).`,
      };
    }
    if (amount < WALLET_LOAD_LIMITS.min) {
      return { ok: false, error: `Minimum redeem amount is $${WALLET_LOAD_LIMITS.min}` };
    }
  }

  if (amount <= 0) return { ok: false, error: "No balance to redeem" };

  return { ok: true, amount: roundMoney(amount) };
}
