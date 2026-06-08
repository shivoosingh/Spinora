import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameRequestForm } from "@/components/dashboard/game-request-form";
import { GameRequestFromUrl } from "@/components/dashboard/game-request-from-url";
import { formatDate } from "@/lib/utils";
import type { RequestStatus } from "@/types/database";

const statusVariant: Record<RequestStatus, "default" | "warning" | "success" | "destructive"> = {
  pending: "warning",
  processing: "default",
  completed: "success",
  rejected: "destructive",
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("game_requests")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Suspense fallback={null}>
        <GameRequestFromUrl />
      </Suspense>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Game Requests</h1>
        <p className="text-muted-foreground">Request and track your game accounts</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>New Request</CardTitle>
            </CardHeader>
            <CardContent>
              <GameRequestForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {requests && requests.length > 0 ? (
            requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{req.game_name}</h3>
                      <p className="text-xs text-muted-foreground">{req.game_provider}</p>
                    </div>
                    <Badge variant={statusVariant[req.status as RequestStatus]}>
                      {req.status}
                    </Badge>
                  </div>
                  {req.notes && <p className="text-sm text-muted-foreground mb-2">{req.notes}</p>}
                  {req.credentials && req.status === "completed" && (
                    <div className="mt-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400 font-semibold mb-1">Your Credentials</p>
                      <p className="text-sm font-mono">{req.credentials}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(req.created_at)}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No requests yet. Submit your first game account request!
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
