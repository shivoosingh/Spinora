import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Gamepad2, MessageSquare, TrendingUp, Star, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminBroadcastNotice } from "@/components/admin/admin-broadcast-notice";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: requestCount },
    { count: pendingCount },
    { count: conversationCount },
    { count: reviewCount },
    { count: pendingTasks },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("game_requests").select("*", { count: "exact", head: true }),
    supabase.from("game_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("user_task_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { icon: Users, label: "Total Users", value: userCount || 0, href: "/admin/users" },
    { icon: Gamepad2, label: "Game Requests", value: requestCount || 0, href: "/admin/requests" },
    {
      icon: TrendingUp,
      label: "Pending Requests",
      value: pendingCount || 0,
      href: "/admin/requests?status=pending",
    },
    { icon: MessageSquare, label: "Active Chats", value: conversationCount || 0, href: "/admin/chat" },
    { icon: Star, label: "Reviews", value: reviewCount || 0, href: "/admin/reviews" },
    { icon: Target, label: "Pending Tasks", value: pendingTasks || 0, href: "/admin/tasks" },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Platform overview and management</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/chat">Open Customer Chat</Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/requests">Manage Requests</Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/users">Manage Users</Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/reviews">Manage Reviews</Link>
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/tasks">Review Tasks</Link>
        </Button>
      </div>

      <div className="mb-6 sm:mb-8">
        <AdminBroadcastNotice />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={cn(
                "group rounded-xl border border-white/10 bg-[#161616] p-3 sm:p-4",
                "transition-all hover:border-orange-500/40 hover:bg-white/5 active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
