"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { broadcastAdminNotice, broadcastMaintenanceNotice } from "@/lib/actions/admin";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

const DEFAULT_TITLE = "Site under maintenance";
const DEFAULT_MESSAGE =
  "Spinora is currently under maintenance. No requests (loads, redeems, new accounts, or deposits) will be approved until further notice. Thank you for your patience — we will update you when service resumes.";

export function AdminBroadcastNotice() {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sendChat, setSendChat] = useState(true);
  const [loading, setLoading] = useState<"custom" | "maintenance" | null>(null);

  async function handleMaintenanceQuickSend() {
    const ok = window.confirm(
      "Send the maintenance notice to EVERY user?\n\nThey will get a notification and a support chat message."
    );
    if (!ok) return;

    setLoading("maintenance");
    const result = await broadcastMaintenanceNotice();
    if (result.error) toast.error(result.error);
    else toast.success(`Maintenance notice sent to ${result.count ?? 0} users`);
    setLoading(null);
  }

  async function handleCustomSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Enter a title and message");
      return;
    }

    const ok = window.confirm(
      `Send this notice to EVERY user?\n\nTitle: ${title.trim()}\n\nThey will get a notification${sendChat ? " and a support chat message" : ""}.`
    );
    if (!ok) return;

    setLoading("custom");
    const result = await broadcastAdminNotice({
      title: title.trim(),
      message: message.trim(),
      type: "warning",
      sendChat,
    });
    if (result.error) toast.error(result.error);
    else toast.success(`Notice sent to ${result.count ?? 0} users`);
    setLoading(null);
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <Megaphone className="h-4 w-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-white">Broadcast notice to all users</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sends an in-app notification to every user. Optionally also posts in their Support chat
            so they see it when they open Messages.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 resize-y min-h-[96px]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={sendChat}
            onChange={(e) => setSendChat(e.target.checked)}
            className="rounded border-border"
          />
          Also send as Support chat message
        </label>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Button
          variant="default"
          className="bg-amber-600 hover:bg-amber-700"
          onClick={handleMaintenanceQuickSend}
          disabled={!!loading}
        >
          {loading === "maintenance" ? "Sending…" : "Send maintenance notice now"}
        </Button>
        <Button variant="outline" onClick={handleCustomSend} disabled={!!loading}>
          {loading === "custom" ? "Sending…" : "Send custom notice"}
        </Button>
      </div>
    </div>
  );
}
