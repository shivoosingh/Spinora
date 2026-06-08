import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/admin/user-actions";
import { AdminWalletGrant } from "@/components/admin/admin-wallet-grant";
import { WalletCard } from "@/components/wallet/wallet-card";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">View and manage platform users</p>
      </div>

      <div className="space-y-3">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{user.full_name || "Unnamed"}</h3>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    {user.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.vip_tier} &middot; {user.vip_points} pts &middot; Joined {formatDate(user.created_at)}
                  </p>
                </div>
                <WalletCard
                  walletBalance={Number(user.wallet_balance ?? 0)}
                  bonusWallet={Number(user.bonus_wallet ?? 0)}
                  className="w-full sm:w-56 shrink-0"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-border">
                <AdminWalletGrant userId={user.id} />
                <UserActions userId={user.id} role={user.role} isSuspended={user.is_suspended} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
