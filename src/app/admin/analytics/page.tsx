import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: totalUsers },
    { count: newUsers },
    { count: totalRequests },
    { count: completedRequests },
    { count: totalReferrals },
    { count: bronzeCount },
    { count: silverCount },
    { count: goldCount },
    { count: platinumCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("game_requests").select("*", { count: "exact", head: true }),
    supabase.from("game_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("vip_tier", "bronze"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("vip_tier", "silver"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("vip_tier", "gold"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("vip_tier", "platinum"),
  ]);

  const tiers: Record<string, number> = {
    bronze: bronzeCount || 0,
    silver: silverCount || 0,
    gold: goldCount || 0,
    platinum: platinumCount || 0,
  };

  const completionRate = totalRequests ? Math.round(((completedRequests || 0) / totalRequests) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and activity tracking</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Users", value: totalUsers || 0 },
          { label: "New Users (30d)", value: newUsers || 0 },
          { label: "Total Requests", value: totalRequests || 0 },
          { label: "Completed Requests", value: completedRequests || 0 },
          { label: "Completion Rate", value: `${completionRate}%` },
          { label: "Total Referrals", value: totalReferrals || 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VIP Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["bronze", "silver", "gold", "platinum"].map((tier) => (
              <div key={tier} className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{tiers[tier] || 0}</p>
                <p className="text-sm text-muted-foreground capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
