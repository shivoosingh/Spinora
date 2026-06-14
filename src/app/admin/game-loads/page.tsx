import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameLoadActions } from "@/components/admin/game-load-actions";
import { formatDate } from "@/lib/utils";
import type { GameLoadStatus } from "@/lib/game-automation/types";

const statusVariant: Record<GameLoadStatus, "default" | "warning" | "success" | "destructive"> = {
  pending: "warning",
  processing: "default",
  completed: "success",
  failed: "destructive",
  cancelled: "destructive",
};

export default async function AdminGameLoadsPage() {
  const supabase = await createClient();

  const { data: loads } = await supabase
    .from("game_load_requests")
    .select("*, user:profiles!game_load_requests_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Game Wallet Loads</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Juwa bot queue — wallet debited when user requests load. Bot or manual complete here.
        </p>
      </div>

      <div className="space-y-4">
        {loads?.length ? (
          loads.map((load) => {
            const user = load.user as { full_name?: string; email?: string } | null;
            return (
              <Card key={load.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{load.game_name}</h3>
                        <Badge variant={statusVariant[load.status as GameLoadStatus]}>
                          {load.status}
                        </Badge>
                        <Badge variant="outline">{load.load_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user?.full_name} ({user?.email})
                      </p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">
                        {load.load_type === "create_account"
                          ? "Free account create"
                          : load.load_type === "redeem"
                            ? load.redeem_all
                              ? `Redeem all → ${load.wallet_type === "bonus" ? "Bonus Redeem" : "Deposit Redeem"}`
                              : `$${Number(load.amount).toFixed(2)} redeem → ${load.wallet_type === "bonus" ? "Bonus Redeem" : "Deposit Redeem"}`
                            : `$${Number(load.amount).toFixed(2)} from ${load.wallet_type} wallet`}
                      </p>
                      {load.wallet_type === "bonus" && load.load_type === "load" && (
                        <Badge variant="secondary" className="mt-1">
                          Bonus wallet load
                        </Badge>
                      )}
                      {load.game_username && (
                        <p className="text-sm mt-1">Game user: {load.game_username}</p>
                      )}
                      {load.bot_attempts > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Bot attempts: {load.bot_attempts}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(load.created_at)}</p>
                    </div>
                    <GameLoadActions load={load} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No wallet load requests yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
