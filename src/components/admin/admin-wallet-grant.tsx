"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminGrantWallet, adminDeductWallet, adminResetWallet } from "@/lib/actions/wallet";
import { toast } from "sonner";

interface AdminWalletGrantProps {
  userId: string;
}

export function AdminWalletGrant({ userId }: AdminWalletGrantProps) {
  const [amount, setAmount] = useState("5");
  const [walletType, setWalletType] = useState<"current" | "bonus">("bonus");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleGrant() {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading("grant");
    const result = await adminGrantWallet(userId, value, walletType);
    if (result.error) toast.error(result.error);
    else toast.success(`Added $${value} to ${walletType} wallet`);
    router.refresh();
    setLoading(null);
  }

  async function handleDeduct() {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount to remove");
      return;
    }
    setLoading("deduct");
    const result = await adminDeductWallet(userId, value, walletType);
    if (result.error) toast.error(result.error);
    else toast.success(`Removed $${value} from ${walletType} wallet`);
    router.refresh();
    setLoading(null);
  }

  async function handleReset() {
    setLoading("reset");
    const result = await adminResetWallet(userId, walletType);
    if (result.error) toast.error(result.error);
    else toast.success(`${walletType === "bonus" ? "Bonus" : "Current"} wallet reset to $0`);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Wallet</label>
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as "current" | "bonus")}
            className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          >
            <option value="bonus">Bonus</option>
            <option value="current">Current</option>
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={handleGrant} disabled={!!loading}>
          {loading === "grant" ? "..." : "Grant $"}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleDeduct} disabled={!!loading}>
          {loading === "deduct" ? "..." : "Remove $"}
        </Button>
        <Button size="sm" variant="destructive" onClick={handleReset} disabled={!!loading}>
          {loading === "reset" ? "..." : "Reset to $0"}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Use Remove $ for partial deduction, or Reset to $0 after the user has played their balance.
      </p>
    </div>
  );
}
