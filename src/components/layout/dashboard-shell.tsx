"use client";

import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar: ReactNode;
}

export function DashboardShell({ children, sidebar }: DashboardShellProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      toast.success("Welcome to Spinora! Your email is verified.");
    }
  }, [searchParams]);

  return (
    <AppShell showTicker={false} showFooter={false} assumeLoggedIn sidebar={sidebar}>
      {children}
    </AppShell>
  );
}
