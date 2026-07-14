"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { MessageRealtimeProvider } from "@/components/chat/message-realtime-provider";
import { createClient } from "@/lib/supabase/client";
import { MessageRealtimeStubProvider } from "@/lib/chat/message-realtime-stub";

const REALTIME_ROUTE_PREFIXES = ["/dashboard", "/admin", "/spin"];

function needsRealtimeImmediately(pathname: string | null): boolean {
  if (!pathname) return false;
  return REALTIME_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function ClientProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoggedIn(false);
      return;
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const useRealtime =
    loggedIn === true && needsRealtimeImmediately(pathname);

  const Provider = useRealtime ? MessageRealtimeProvider : MessageRealtimeStubProvider;

  return (
    <>
      <Provider>{children}</Provider>
      <Toaster richColors closeButton position="top-center" />
    </>
  );
}
