import type { WalletType } from "@/lib/wallet/types";
import { walletTypeLabel } from "@/lib/wallet/types";

export interface WalletTransactionRow {
  id: string;
  amount: number;
  wallet_type: WalletType;
  transaction_type: "credit" | "debit" | "adjustment";
  source: string;
  description: string | null;
  created_at: string;
}

export interface BonusGameLoadRow {
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
}

const SOURCE_LABELS: Record<string, string> = {
  game_load: "Game load",
  game_load_refund: "Load refund",
  game_redeem: "Game redeem",
  admin: "Admin adjustment",
  spin: "Spin prize",
  daily_task: "Daily task",
};

export function transactionSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}

export function formatTransactionAmount(
  amount: number,
  transactionType: WalletTransactionRow["transaction_type"]
): string {
  const prefix = transactionType === "debit" ? "−" : "+";
  return `${prefix}$${Number(amount).toFixed(2)}`;
}

export function transactionSummary(tx: WalletTransactionRow): string {
  const wallet = walletTypeLabel(tx.wallet_type);
  const source = transactionSourceLabel(tx.source);
  return tx.description?.trim() || `${source} · ${wallet}`;
}

export function gameLoadSummary(load: BonusGameLoadRow): string {
  if (load.load_type === "create_account") return `Create account · ${load.game_name}`;
  if (load.load_type === "redeem") {
    if (load.redeem_all) return `Redeem all · ${load.game_name} → Bonus Redeem`;
    return `Redeem $${Number(load.amount).toFixed(2)} · ${load.game_name} → Bonus Redeem`;
  }
  if (load.load_type === "check_balance") return `Balance check · ${load.game_name}`;
  return `Load $${Number(load.amount).toFixed(2)} · ${load.game_name} (bonus wallet)`;
}
