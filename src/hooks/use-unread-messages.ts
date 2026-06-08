"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUnreadMessageCount } from "@/lib/actions/messages";

export function useUnreadMessages() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const total = await getUnreadMessageCount();
    setCount(total);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (!conversations?.length) return;

      const ids = conversations.map((c) => c.id).join(",");
      channel = supabase
        .channel(`unread-messages-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `conversation_id=in.(${ids})`,
          },
          () => {
            refresh();
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { count, refresh };
}
