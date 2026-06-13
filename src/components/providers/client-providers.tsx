"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MessageRealtimeStubProvider } from "@/lib/chat/message-realtime-stub";

/** Logged-in users load realtime immediately; guests defer until idle. */
export function ClientProviders({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<{ children: ReactNode }>>(
    () => MessageRealtimeStubProvider
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const loadRealtime = () => {
      void import("@/components/chat/message-realtime-provider").then((mod) => {
        setProvider(() => mod.MessageRealtimeProvider);
      });
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadRealtime();
        return;
      }

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadRealtime, { timeout: 4000 });
      } else {
        setTimeout(loadRealtime, 3000);
      }
    });
  }, []);

  return (
    <Provider>
      {children}
      <Toaster richColors closeButton position="top-center" />
    </Provider>
  );
}
