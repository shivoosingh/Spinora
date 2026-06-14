"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { walletTypeLabel, type WalletType } from "@/lib/wallet/types";
import {
  formatTransactionAmount,
  transactionSourceLabel,
  transactionSummary,
  type WalletTransactionRow,
} from "@/lib/wallet/transaction-display";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminTransactionRow {
  id: string;
  amount: number;
  wallet_type: string;
  transaction_type: string;
  source: string;
  description: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

interface AdminTransactionsListProps {
  transactions: AdminTransactionRow[];
}

type WalletFilter = "all" | WalletType;

const PAGE_SIZE = 40;

const FILTER_OPTIONS: { id: WalletFilter; label: string }[] = [
  { id: "all", label: "All wallets" },
  { id: "bonus", label: "Bonus Wallet" },
  { id: "bonus_redeem", label: "Bonus Redeem" },
  { id: "current", label: "Total Deposit" },
  { id: "cashout", label: "Deposit Redeem" },
];

export function AdminTransactionsList({ transactions }: AdminTransactionsListProps) {
  const [query, setQuery] = useState("");
  const [walletFilter, setWalletFilter] = useState<WalletFilter>("bonus");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return transactions.filter((row) => {
      if (walletFilter !== "all" && row.wallet_type !== walletFilter) return false;
      if (!q) return true;

      const user = row.user;
      return (
        user?.full_name?.toLowerCase().includes(q) ||
        user?.email?.toLowerCase().includes(q) ||
        row.description?.toLowerCase().includes(q) ||
        row.source.toLowerCase().includes(q) ||
        row.wallet_type.toLowerCase().includes(q) ||
        transactionSourceLabel(row.source).toLowerCase().includes(q)
      );
    });
  }, [transactions, query, walletFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const bonusCount = useMemo(
    () => transactions.filter((t) => t.wallet_type === "bonus").length,
    [transactions]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search by user, email, game, or description..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            size="sm"
            variant={walletFilter === opt.id ? "default" : "outline"}
            onClick={() => {
              setWalletFilter(opt.id);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {opt.label}
            {opt.id === "bonus" && bonusCount > 0 && (
              <span className="ml-1.5 opacity-80">({bonusCount})</span>
            )}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
        {query.trim() ? " found" : walletFilter === "bonus" ? " · bonus wallet loads & credits" : ""}
      </p>

      <div className="space-y-3">
        {visible.map((row) => {
          const user = row.user;
          const tx = row as WalletTransactionRow;
          const isDebit = row.transaction_type === "debit";

          return (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {user?.full_name || "Unnamed user"}
                      </h3>
                      <Badge variant="outline">{transactionSourceLabel(row.source)}</Badge>
                      <Badge variant="secondary">{walletTypeLabel(row.wallet_type as WalletType)}</Badge>
                      <Badge variant={isDebit ? "warning" : "success"}>
                        {isDebit ? "Debit" : row.transaction_type === "credit" ? "Credit" : "Adjustment"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">{user?.email ?? "—"}</p>
                    <p className="text-sm mt-2">{transactionSummary(tx)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(row.created_at)} · {formatRelativeTime(row.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        isDebit ? "text-amber-400" : "text-emerald-400"
                      )}
                    >
                      {formatTransactionAmount(Number(row.amount), tx.transaction_type)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Transaction ID</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                      {row.id.slice(0, 8)}…
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No transactions match your search
              {walletFilter !== "all" ? ` in ${walletTypeLabel(walletFilter as WalletType)}` : ""}.
            </p>
          </Card>
        )}

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load more ({filtered.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
