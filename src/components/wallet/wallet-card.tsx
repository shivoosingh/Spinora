import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletCardProps {
  walletBalance: number;
  bonusWallet: number;
  className?: string;
}

function formatMoney(amount: number) {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function WalletCard({ walletBalance, bonusWallet, className }: WalletCardProps) {
  return (
    <div className={cn("wallet-card relative pt-5", className)}>
      {/* Top gold accent + icon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
        <div className="wallet-card-notch" />
        <div className="absolute left-1/2 top-3 -translate-x-1/2 w-9 h-9 rounded-full bg-[#1a1030] border-2 border-amber-500/80 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Wallet className="h-4 w-4 text-amber-400" />
        </div>
      </div>

      <div className="wallet-card-body grid grid-cols-2 divide-x divide-white/10 pt-6 pb-4 px-2">
        <div className="text-center px-2">
          <p className="text-[11px] text-white/70 mb-1">Current Wallet</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">
            {formatMoney(walletBalance)}
          </p>
        </div>
        <div className="text-center px-2">
          <p className="text-[11px] text-white/70 mb-1">Bonus Wallet</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">
            {formatMoney(bonusWallet)}
          </p>
        </div>
      </div>
    </div>
  );
}
