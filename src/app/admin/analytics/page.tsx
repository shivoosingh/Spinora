import type { Metadata } from "next";
import { format } from "date-fns";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  CoinsBarChart,
  SignupsAreaChart,
  TierPieChart,
} from "@/components/admin/analytics-charts-lazy";
import { GlassCard } from "@/components/shared/glass-card";
import { StatCard } from "@/components/shared/stat-card";
import { adminDb } from "@/lib/actions/admin/core";
import { requirePermission } from "@/lib/data/admin";
import { ArrowDownToLine, Coins, DollarSign, Sparkles, TrendingUp, UserPlus, Users } from "lucide-react";

export const metadata: Metadata = { title: "Analytics" };

const DAYS = 30;

export default async function AdminAnalyticsPage() {
  await requirePermission("analytics.read");
  const db = adminDb();

  const since = new Date(Date.now() - DAYS * 86_400_000);
  const sinceIso = since.toISOString();

  const [signupsRes, coinsRes, tiersRes, vipStatusRes, referralsRes, depositsRes, topDepositorRes] =
    await Promise.all([
      db.from("profiles").select("created_at").gte("created_at", sinceIso),
      db
        .from("ledger_entries")
        .select("amount, created_at")
        .eq("currency", "coins")
        .gt("amount", 0)
        .gte("created_at", sinceIso),
      db.from("vip_tiers").select("id, name, rank").order("rank"),
      db.from("vip_status").select("tier_id"),
      db.from("referrals").select("status"),
      db
        .from("requests")
        .select("deposit_amount, status, user_id, created_at")
        .eq("status", "fulfilled"),
      db
        .from("requests")
        .select("user_id, deposit_amount, name")
        .eq("status", "fulfilled")
        .not("user_id", "is", null)
        .order("deposit_amount", { ascending: false })
        .limit(10),
    ]);

  // ── daily buckets ──
  const dayKeys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const signupBuckets = new Map(dayKeys.map((k) => [k, 0]));
  for (const row of signupsRes.data ?? []) {
    const k = row.created_at.slice(0, 10);
    if (signupBuckets.has(k)) signupBuckets.set(k, signupBuckets.get(k)! + 1);
  }
  const signupData = dayKeys.map((k) => ({
    date: format(new Date(k), "MMM d"),
    signups: signupBuckets.get(k) ?? 0,
  }));

  const coinBuckets = new Map(dayKeys.map((k) => [k, 0]));
  let totalCoins = 0;
  for (const row of coinsRes.data ?? []) {
    const k = row.created_at.slice(0, 10);
    totalCoins += row.amount;
    if (coinBuckets.has(k)) coinBuckets.set(k, coinBuckets.get(k)! + row.amount);
  }
  const coinData = dayKeys.map((k) => ({
    date: format(new Date(k), "MMM d"),
    coins: coinBuckets.get(k) ?? 0,
  }));

  // ── tier distribution ──
  const tierNames = new Map((tiersRes.data ?? []).map((t) => [t.id, t.name]));
  const tierCounts = new Map<string, number>();
  for (const s of vipStatusRes.data ?? []) {
    const name = tierNames.get(s.tier_id) ?? "Unknown";
    tierCounts.set(name, (tierCounts.get(name) ?? 0) + 1);
  }
  const tierData = (tiersRes.data ?? [])
    .map((t) => ({ tier: t.name, members: tierCounts.get(t.name) ?? 0 }))
    .filter((d) => d.members > 0);

  // ── referral conversion ──
  const referrals = referralsRes.data ?? [];
  const totalRef = referrals.length;
  const convertedRef = referrals.filter(
    (r) => r.status === "qualified" || r.status === "rewarded"
  ).length;
  const conversionRate =
    totalRef > 0 ? Math.round((convertedRef / totalRef) * 100) : 0;

  const totalSignups = (signupsRes.data ?? []).length;

  // ── revenue metrics ──
  const fulfilledDeposits = depositsRes.data ?? [];
  const totalCashDeposited = fulfilledDeposits.reduce((sum, r) => sum + (r.deposit_amount ?? 0), 0);
  const totalDepositors = new Set(fulfilledDeposits.map((r) => r.user_id).filter(Boolean)).size;
  const avgLtv = totalDepositors > 0 ? totalCashDeposited / totalDepositors : 0;

  // LTV per user
  const ltvMap = new Map<string, { name: string; total: number }>();
  for (const dep of fulfilledDeposits) {
    if (!dep.user_id) continue;
    const existing = ltvMap.get(dep.user_id);
    if (existing) existing.total += dep.deposit_amount ?? 0;
    else ltvMap.set(dep.user_id, { name: "—", total: dep.deposit_amount ?? 0 });
  }
  const topDepositors = (topDepositorRes.data ?? [])
    .reduce<Array<{ user_id: string; name: string; total: number }>>((acc, row) => {
      if (!row.user_id) return acc;
      const existing = acc.find((r) => r.user_id === row.user_id);
      if (existing) existing.total += row.deposit_amount ?? 0;
      else acc.push({ user_id: row.user_id, name: row.name ?? "—", total: row.deposit_amount ?? 0 });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Analytics"
        description={`Platform performance over the last ${DAYS} days.`}
      />

      {/* ── revenue overview ── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Revenue</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total cash deposited"
          value={`$${totalCashDeposited.toLocaleString()}`}
          icon={<DollarSign />}
          accent="gold"
        />
        <StatCard
          label="Fulfilled deposits"
          value={fulfilledDeposits.length.toLocaleString()}
          icon={<ArrowDownToLine />}
          accent="emerald"
        />
        <StatCard
          label="Unique depositors"
          value={totalDepositors.toLocaleString()}
          icon={<Users />}
          accent="cyan"
        />
        <StatCard
          label="Avg player LTV"
          value={`$${avgLtv.toFixed(2)}`}
          icon={<TrendingUp />}
          accent="purple"
        />
      </div>

      {/* ── top depositors ── */}
      {topDepositors.length > 0 && (
        <GlassCard className="mb-6 p-6">
          <h2 className="mb-4 font-bold">Top Depositors</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/8 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">User ID</th>
                  <th className="pb-2 text-right">Total Deposited</th>
                </tr>
              </thead>
              <tbody>
                {topDepositors.map((dep, i) => (
                  <tr key={dep.user_id} className="border-b border-foreground/5 last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{dep.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {dep.user_id.slice(0, 8)}…
                    </td>
                    <td className="tnum py-2 text-right font-bold text-ws-green-deep dark:text-ws-green">
                      ${dep.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ── engagement metrics ── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Engagement</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New members (30d)"
          value={totalSignups.toLocaleString()}
          icon={<UserPlus />}
          accent="cyan"
        />
        <StatCard
          label="Coins issued (30d)"
          value={totalCoins.toLocaleString()}
          icon={<Coins />}
          accent="gold"
        />
        <StatCard
          label="Referral conversion"
          value={`${conversionRate}%`}
          icon={<TrendingUp />}
          accent="emerald"
        />
        <StatCard
          label="VIP members"
          value={(vipStatusRes.data ?? []).length.toLocaleString()}
          icon={<Sparkles />}
          accent="purple"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-bold">Member growth</h2>
          <SignupsAreaChart data={signupData} />
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-bold">Coins issued</h2>
          <CoinsBarChart data={coinData} />
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-bold">VIP tier distribution</h2>
          {tierData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No VIP members yet.
            </p>
          ) : (
            <TierPieChart data={tierData} />
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-bold">Referral funnel</h2>
          <dl className="space-y-3">
            {[
              { label: "Total referrals", value: totalRef },
              { label: "Qualified / rewarded", value: convertedRef },
              {
                label: "Pending",
                value: referrals.filter((r) => r.status === "pending").length,
              },
              {
                label: "Rejected",
                value: referrals.filter((r) => r.status === "rejected").length,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-foreground/8 pb-2 last:border-0"
              >
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="tnum text-sm font-semibold">
                  {row.value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      </div>
    </div>
  );
}
