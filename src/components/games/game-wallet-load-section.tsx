"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Zap,
  RefreshCw,
  Pencil,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  requestGameLoad,
  requestGameRedeem,
  requestGameAccountCreate,
  requestGameCheckBalance,
  getMyGameLoads,
  getMyGameAccount,
} from "@/lib/actions/game-loads";
import type { Game } from "@/lib/games";
import type { GameLoadRequest } from "@/lib/game-automation/types";
import { WALLET_LOAD_LIMITS } from "@/lib/game-automation/config";
import { previewJuwaUsername } from "@/lib/game-automation/juwa-credentials";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface GameWalletLoadSectionProps {
  game: Game;
}

/** Layui agent panels (Gameroom family) — stricter username/password rules. */
const LAYUI_PANEL_SLUGS = ["gameroom", "cash-machine", "mr-all-in-one"] as const;

function isLayuiPanelGame(slug: string): boolean {
  return (LAYUI_PANEL_SLUGS as readonly string[]).includes(slug);
}

export function GameWalletLoadSection({ game }: GameWalletLoadSectionProps) {
  const supabase = useMemo(() => createClient(), []);

  const [walletBalance, setWalletBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [amount, setAmount] = useState(String(WALLET_LOAD_LIMITS.min));
  const [redeemAmount, setRedeemAmount] = useState(String(WALLET_LOAD_LIMITS.min));
  const [redeemAll, setRedeemAll] = useState(false);
  const [walletType, setWalletType] = useState<"current" | "bonus">("bonus");
  const [redeemWalletType, setRedeemWalletType] = useState<"current" | "bonus">("current");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [fundsTab, setFundsTab] = useState<"load" | "redeem">("load");
  const [customMode, setCustomMode] = useState(false);
  const [customUsername, setCustomUsername] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [recentLoads, setRecentLoads] = useState<GameLoadRequest[]>([]);
  const [requesterName, setRequesterName] = useState<string | null>(null);
  const [requesterEmail, setRequesterEmail] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<{
    game_username: string;
    game_password: string | null;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("wallet_balance, bonus_wallet, full_name, email")
      .eq("id", user.id)
      .single();

    if (data) {
      setWalletBalance(Number(data.wallet_balance ?? 0));
      setBonusBalance(Number(data.bonus_wallet ?? 0));
      setRequesterName(data.full_name ?? null);
      setRequesterEmail(data.email ?? null);
    }
  }, [supabase]);

  const refreshAccount = useCallback(async () => {
    const account = await getMyGameAccount(game.slug);
    if (account?.game_username) {
      setSavedAccount({
        game_username: account.game_username,
        game_password: account.game_password,
      });
    }
  }, [game.slug]);

  const refreshLoads = useCallback(async () => {
    const loads = await getMyGameLoads(game.slug);
    setRecentLoads(loads as GameLoadRequest[]);

    const completedCreate = loads.find(
      (l) =>
        l.status === "completed" &&
        (l.load_type === "create_account" || l.load_type === "new_account") &&
        l.game_username
    );
    if (completedCreate?.game_username) {
      setSavedAccount({
        game_username: completedCreate.game_username,
        game_password: completedCreate.game_password,
      });
    }
  }, [game.slug]);

  useEffect(() => {
    void refreshWallet();
    void refreshAccount();
    void refreshLoads();
    const interval = setInterval(() => {
      void refreshLoads();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshWallet, refreshAccount, refreshLoads]);

  useEffect(() => {
    const bal = walletType === "current" ? walletBalance : bonusBalance;
    if (bal > 0) {
      const suggested = Math.min(bal, WALLET_LOAD_LIMITS.max);
      setAmount(String(Math.round(suggested * 100) / 100));
    }
  }, [walletType, walletBalance, bonusBalance]);

  const available = walletType === "current" ? walletBalance : bonusBalance;
  const parsedAmount = parseFloat(amount) || 0;
  const previewAccount = previewJuwaUsername(requesterName, requesterEmail);
  const pendingCreate = recentLoads.some(
    (l) =>
      (l.load_type === "create_account" || l.load_type === "new_account") &&
      (l.status === "pending" || l.status === "processing")
  );
  const pendingLoad = recentLoads.some(
    (l) =>
      (l.load_type === "load" || l.load_type === "reload") &&
      (l.status === "pending" || l.status === "processing")
  );
  const pendingRedeem = recentLoads.some(
    (l) => l.load_type === "redeem" && (l.status === "pending" || l.status === "processing")
  );
  const pendingCheck = recentLoads.some(
    (l) => l.load_type === "check_balance" && (l.status === "pending" || l.status === "processing")
  );
  const lastBalanceCheck = recentLoads.find(
    (l) => l.load_type === "check_balance" && l.status === "completed"
  );
  const lastKnownBalance = lastBalanceCheck ? Number(lastBalanceCheck.amount) : null;
  const parsedRedeemAmount = parseFloat(redeemAmount) || 0;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  async function handleCreateAccount(custom?: { username: string; password: string }) {
    setCreating(true);
    const result = await requestGameAccountCreate({
      gameSlug: game.slug,
      gameName: game.name,
      username: custom?.username,
      password: custom?.password,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Creating your ${game.name} account…`);
      setCustomMode(false);
      setCustomUsername("");
      setCustomPassword("");
    }
    void refreshLoads();
    setCreating(false);
  }

  async function handleCreateCustom() {
    const username = customUsername.trim();
    const password = customPassword.trim();
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username: letters, numbers, and underscores only");
      return;
    }
    if (isLayuiPanelGame(game.slug)) {
      if (username.length < 6 || username.length > 13) {
        toast.error("Username must be 6–13 characters for this game");
        return;
      }
      const layuiPassword = password.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (layuiPassword.length < 6 || layuiPassword.length > 13) {
        toast.error("Password must be 6–13 letters and numbers only (no symbols)");
        return;
      }
      if (!/[a-z]/.test(layuiPassword) || !/[0-9]/.test(layuiPassword)) {
        toast.error("Password must include both letters and numbers (e.g. player1)");
        return;
      }
      await handleCreateAccount({ username: username.toLowerCase(), password: layuiPassword });
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    await handleCreateAccount({ username, password });
  }

  async function handleCheckBalance() {
    if (!savedAccount?.game_username) {
      toast.error("Create your account first");
      return;
    }
    setCheckingBalance(true);
    const result = await requestGameCheckBalance({
      gameSlug: game.slug,
      gameName: game.name,
      gameUsername: savedAccount.game_username,
    });
    if (result.error) toast.error(result.error);
    else toast.success("Checking your live game balance…");
    void refreshLoads();
    setCheckingBalance(false);
  }

  async function handleLoad() {
    if (!savedAccount?.game_username) {
      toast.error("Create your account first");
      return;
    }
    if (parsedAmount < WALLET_LOAD_LIMITS.min || parsedAmount > WALLET_LOAD_LIMITS.max) {
      toast.error(`Enter $${WALLET_LOAD_LIMITS.min}–$${WALLET_LOAD_LIMITS.max}`);
      return;
    }
    if (parsedAmount > available) {
      toast.error("Not enough balance in selected wallet");
      return;
    }

    setLoading(true);
    const result = await requestGameLoad({
      gameSlug: game.slug,
      gameName: game.name,
      amount: parsedAmount,
      walletType,
      gameUsername: savedAccount.game_username,
    });

    if (result.error) toast.error(result.error);
    else {
      toast.success(`Load queued! $${parsedAmount.toFixed(2)} — bot will credit ${game.name} shortly.`);
      void refreshWallet();
      void refreshLoads();
    }
    setLoading(false);
  }

  async function handleRedeem() {
    if (!savedAccount?.game_username) {
      toast.error("Create your account first");
      return;
    }
    if (!redeemAll) {
      if (parsedRedeemAmount < WALLET_LOAD_LIMITS.min || parsedRedeemAmount > WALLET_LOAD_LIMITS.max) {
        toast.error(`Enter $${WALLET_LOAD_LIMITS.min}–$${WALLET_LOAD_LIMITS.max}`);
        return;
      }
    }

    setRedeeming(true);
    const result = await requestGameRedeem({
      gameSlug: game.slug,
      gameName: game.name,
      amount: redeemAll ? undefined : parsedRedeemAmount,
      redeemAll,
      gameUsername: savedAccount.game_username,
      walletType: redeemWalletType,
    });

    const destLabel = redeemWalletType === "bonus" ? "Bonus Redeem" : "Deposit Redeem";
    if (result.error) toast.error(result.error);
    else {
      toast.success(
        redeemAll
          ? `Redeem queued — bot will cash out your full game balance to your ${destLabel} wallet.`
          : `Redeem queued! $${parsedRedeemAmount.toFixed(2)} will move to your ${destLabel} wallet.`
      );
      void refreshWallet();
      void refreshLoads();
    }
    setRedeeming(false);
  }

  function activityLabel(load: GameLoadRequest) {
    if (load.load_type === "create_account" || load.load_type === "new_account") {
      return "Create account";
    }
    if (load.load_type === "check_balance") {
      return load.status === "completed"
        ? `Balance check · $${Number(load.amount).toFixed(2)}`
        : "Balance check";
    }
    if (load.load_type === "redeem") {
      if (load.redeem_all && load.status === "completed") {
        return `$${Number(load.amount).toFixed(2)} redeem (all)`;
      }
      if (load.redeem_all) return "Redeem all";
      return `$${Number(load.amount).toFixed(2)} redeem`;
    }
    return `$${Number(load.amount).toFixed(2)} load`;
  }

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-[#161616] p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-emerald-400" />
        <h2 className="font-bold text-white">{game.name} Account</h2>
      </div>

      {/* Your Account — like Game Vault */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Account
        </p>

        {savedAccount ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Username</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white">{savedAccount.game_username}</span>
                  <button
                    type="button"
                    onClick={() => copyText(savedAccount.game_username, "Username")}
                    className="text-muted-foreground hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {savedAccount.game_password && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">
                      {showPassword ? savedAccount.game_password : "••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(savedAccount.game_password!, "Password")}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 mt-1">
                <span className="text-muted-foreground">Last known balance</span>
                <span className="font-semibold text-white">
                  {lastKnownBalance !== null ? `$${lastKnownBalance.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckBalance}
              disabled={checkingBalance || pendingCheck}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              {checkingBalance || pendingCheck ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {pendingCheck ? "Checking balance…" : "Check Balance"}
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No account yet. Create one below — free, no wallet charge.
          </p>
        )}

        {customMode ? (
          <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-black/30 p-3">
            <p className="text-xs font-semibold text-emerald-200">Choose your own login</p>
            <input
              type="text"
              value={customUsername}
              onChange={(e) => setCustomUsername(e.target.value)}
              placeholder="Username (letters, numbers, _)"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Password"
              autoComplete="off"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-muted-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              If the name is taken on the game server, we&apos;ll add a number/letter to keep it unique.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateCustom}
                disabled={creating || pendingCreate}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {creating || pendingCreate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create with these
              </button>
              <button
                type="button"
                onClick={() => setCustomMode(false)}
                disabled={creating || pendingCreate}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCreateAccount()}
              disabled={creating || pendingCreate}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {creating || pendingCreate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {pendingCreate ? "Creating account…" : savedAccount ? "Create New Account" : "Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              disabled={creating || pendingCreate}
              title="Choose your own username & password"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Own login</span>
            </button>
          </div>
        )}

        {!savedAccount && !customMode && previewAccount && (
          <p className="text-xs text-muted-foreground text-center">
            Will be created as <span className="font-mono text-emerald-300">{previewAccount}</span> (same password)
          </p>
        )}
      </div>

      {/* Load / Redeem */}
      <div className="rounded-xl border border-orange-500/20 bg-black/20 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFundsTab("load")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              fundsTab === "load"
                ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
                : "border-white/10 text-muted-foreground hover:text-white"
            )}
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
            Load
          </button>
          <button
            type="button"
            onClick={() => setFundsTab("redeem")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
              fundsTab === "redeem"
                ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                : "border-white/10 text-muted-foreground hover:text-white"
            )}
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Redeem
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <span className="text-muted-foreground">Total Deposit</span>
            <p className="font-semibold text-white">${walletBalance.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <span className="text-muted-foreground">Bonus wallet</span>
            <p className="font-semibold text-white">${bonusBalance.toFixed(2)}</p>
          </div>
        </div>

        {fundsTab === "load" ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Load Credits
            </p>

            <div className="flex flex-wrap gap-2">
              {(["current", "bonus"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setWalletType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    walletType === type
                      ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
                      : "border-white/10 text-muted-foreground hover:text-white"
                  )}
                >
                  {type === "current" ? "Total Deposit" : "Bonus wallet"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  min={WALLET_LOAD_LIMITS.min}
                  max={Math.min(WALLET_LOAD_LIMITS.max, available || WALLET_LOAD_LIMITS.max)}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!savedAccount}
                  className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-4 py-3 text-sm text-white disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleLoad}
                disabled={loading || pendingLoad || !savedAccount || available < WALLET_LOAD_LIMITS.min}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
              >
                {loading || pendingLoad ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Load
              </button>
            </div>

            {!savedAccount && (
              <p className="text-xs text-amber-400/90">Create your account first, then load credits.</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Redeem Credits
            </p>
            <p className="text-xs text-muted-foreground">
              Pull credits from your {game.name} account back to your Spinora wallet.
            </p>

            <div className="flex flex-wrap gap-2">
              {(["current", "bonus"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRedeemWalletType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    redeemWalletType === type
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                      : "border-white/10 text-muted-foreground hover:text-white"
                  )}
                >
                  {type === "current" ? "To Deposit Redeem" : "To Bonus Redeem"}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input
                type="checkbox"
                checked={redeemAll}
                onChange={(e) => setRedeemAll(e.target.checked)}
                disabled={!savedAccount}
                className="rounded border-white/20"
              />
              Redeem all (zero out game account)
            </label>

            {!redeemAll && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={WALLET_LOAD_LIMITS.min}
                    max={WALLET_LOAD_LIMITS.max}
                    step="0.01"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    disabled={!savedAccount}
                    className="w-full rounded-xl border border-white/10 bg-black/30 pl-7 pr-4 py-3 text-sm text-white disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={redeeming || pendingRedeem || !savedAccount}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
                >
                  {redeeming || pendingRedeem ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4" />
                  )}
                  Redeem
                </button>
              </div>
            )}

            {redeemAll && (
              <button
                type="button"
                onClick={handleRedeem}
                disabled={redeeming || pendingRedeem || !savedAccount}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
              >
                {redeeming || pendingRedeem ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                Redeem All
              </button>
            )}

            {!savedAccount && (
              <p className="text-xs text-amber-400/90">Create your account first, then redeem credits.</p>
            )}
          </>
        )}
      </div>

      {recentLoads.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </p>
          {recentLoads.slice(0, 5).map((load) => (
            <div key={load.id} className="rounded-lg bg-black/20 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {activityLabel(load)}
                  {" · "}
                  {load.status}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {formatRelativeTime(load.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
