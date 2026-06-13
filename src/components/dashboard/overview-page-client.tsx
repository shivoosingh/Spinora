"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Crown, Users, Bell, Star } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardRouteLoading } from "@/components/dashboard/dashboard-route-loading";
import { ReviewsPreviewClient } from "@/components/dashboard/reviews-preview-client";
import { useDashboardSession } from "@/lib/dashboard/use-dashboard-session";
import { VIP_TIERS } from "@/lib/constants";

interface OverviewStats {
  tasksCompleted: number;
  referralCount: number;
  notifCount: number;
  reviewCount: number;
  vipTier: string;
  vipPoints: number;
  fullName: string | null;
}

export function OverviewPageClient() {
  const { supabase, userId, ready } = useDashboardSession();
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    if (!ready || !supabase || !userId) return;

    let cancelled = false;

    void Promise.all([
      supabase
        .from("user_task_levels")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("reward_granted", true),
      supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", userId),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
      supabase.from("reviews").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("vip_tier, vip_points, full_name")
        .eq("id", userId)
        .single(),
    ]).then(([reqRes, refRes, notifRes, reviewRes, profileRes]) => {
      if (cancelled) return;
      const profile = profileRes.data;
      setStats({
        tasksCompleted: reqRes.count ?? 0,
        referralCount: refRes.count ?? 0,
        notifCount: notifRes.count ?? 0,
        reviewCount: reviewRes.count ?? 0,
        vipTier: profile?.vip_tier ?? "bronze",
        vipPoints: profile?.vip_points ?? 0,
        fullName: profile?.full_name ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [ready, supabase, userId]);

  if (!stats) {
    return <DashboardRouteLoading cards={4} />;
  }

  const currentTier = VIP_TIERS.find((t) => t.id === stats.vipTier);
  const nextTier = VIP_TIERS[VIP_TIERS.findIndex((t) => t.id === stats.vipTier) + 1];
  const progress = nextTier ? (stats.vipPoints / nextTier.minPoints) * 100 : 100;

  const statCards = [
    { icon: Target, label: "Task Rewards Claimed", value: stats.tasksCompleted, href: "/dashboard/tasks" },
    { icon: Crown, label: "VIP Tier", value: currentTier?.name || "Bronze", href: "/dashboard/vip" },
    { icon: Users, label: "Referrals", value: stats.referralCount, href: "/dashboard/referrals" },
    { icon: Star, label: "Reviews", value: stats.reviewCount, href: "/dashboard/reviews" },
    { icon: Bell, label: "Unread Alerts", value: stats.notifCount },
  ];

  return (
    <div>
      <DashboardPageHeader
        title={`Welcome back, ${stats.fullName || "Player"}`}
        description="Here's your account overview"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
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
            <Link key={stat.label} href={stat.href} prefetch>
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
              <span className="text-sm text-muted-foreground">{stats.vipPoints} points</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="mb-2" />
            {nextTier && (
              <p className="text-xs text-muted-foreground">
                {nextTier.minPoints - stats.vipPoints} points to {nextTier.name}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/tasks" prefetch>
                Open Daily Tasks
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/referrals" prefetch>
                Share Referral
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/messages" prefetch>
                Open Messages
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reviews" prefetch>
                Write a Review
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <ReviewsPreviewClient />
      </div>
    </div>
  );
}
