import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestActions } from "@/components/admin/request-actions";
import { GameRequestsLiveRefresh } from "@/components/requests/game-requests-live-refresh";
import { formatDate } from "@/lib/utils";
import type { RequestStatus } from "@/types/database";

const statusVariant: Record<RequestStatus, "default" | "warning" | "success" | "destructive"> = {
  pending: "warning",
  processing: "default",
  completed: "success",
  rejected: "destructive",
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("game_requests")
    .select("*, user:profiles!game_requests_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status === "pending") {
    query = query.eq("status", "pending");
  }

  const { data: requests } = await query;

  return (
    <div>
      <GameRequestsLiveRefresh />
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Game Requests</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {status === "pending" ? "Showing pending requests only" : "Manage and process game account requests"}
        </p>
      </div>

      <div className="space-y-4">
        {requests?.map((req) => {
          const user = req.user as { full_name?: string; email?: string };
          return (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{req.game_name}</h3>
                      <Badge variant={statusVariant[req.status as RequestStatus]}>{req.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user?.full_name} ({user?.email}) &middot; {req.game_provider}
                    </p>
                    {req.notes && <p className="text-sm mt-2">Notes: {req.notes}</p>}
                    {req.admin_notes && <p className="text-sm mt-1 text-primary">Admin: {req.admin_notes}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(req.created_at)}</p>
                  </div>
                  <RequestActions requestId={req.id} currentStatus={req.status as RequestStatus} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
