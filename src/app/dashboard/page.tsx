import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gamepad2, Crown, Users, Bell } from "lucide-react";
import { VIP_TIERS } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getProfile } from "@/lib/supabase/session";
import { WalletCard } from "@/components/wallet/wallet-card";
import { getMyWallet } from "@/lib/actions/wallet";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const profile = await getProfile();
  const supabase = await createClient();
  const wallet = await getMyWallet();

  const [{ count: requestCount }, { count: referralCount }, { count: notifCount }] =
    await Promise.all([
      supabase
        .from("game_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id),
      supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user!.id),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false),
    ]);

  const currentTier = VIP_TIERS.find((t) => t.id === profile?.vip_tier);
  const nextTier = VIP_TIERS[VIP_TIERS.findIndex((t) => t.id === profile?.vip_tier) + 1];
  const progress = nextTier
    ? ((profile?.vip_points || 0) / nextTier.minPoints) * 100
    : 100;

  return (
    <div>
      <div className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {profile?.full_name || "Player"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s your account overview</p>
        </div>
        {!("error" in wallet) && (
          <WalletCard
            walletBalance={wallet.walletBalance}
            bonusWallet={wallet.bonusWallet}
            className="w-full max-w-xs shrink-0"
          />
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Gamepad2, label: "Game Requests", value: requestCount || 0, href: "/dashboard/requests" },
          { icon: Crown, label: "VIP Tier", value: currentTier?.name || "Bronze", href: "/dashboard/vip" },
          { icon: Users, label: "Referrals", value: referralCount || 0, href: "/dashboard/referrals" },
          { icon: Bell, label: "Unread Alerts", value: notifCount || 0 },
        ].map((stat) => {
          const Icon = stat.icon;
          const inner = (
            <Card className={stat.href ? "hover:glow-purple transition-all cursor-pointer" : ""}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {inner}
            </Link>
          ) : (
            <div key={stat.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" /> VIP Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge>{currentTier?.name}</Badge>
              <span className="text-sm text-muted-foreground">{profile?.vip_points || 0} points</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="mb-2" />
            {nextTier && (
              <p className="text-xs text-muted-foreground">
                {nextTier.minPoints - (profile?.vip_points || 0)} points to {nextTier.name}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link href="/dashboard/requests">Request Game Account</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard/referrals">Share Referral</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard/messages">Open Messages</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
