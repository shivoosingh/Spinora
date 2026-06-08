"use client";

import { useRouter } from "next/navigation";
import { HomeSidebar } from "@/components/home/home-sidebar";
import { WalletCardLoader } from "@/components/wallet/wallet-card-loader";
import { AppShell } from "@/components/layout/app-shell";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();

  function handleSearch() {
    router.push("/#games");
  }

  return (
    <AppShell
      onSearchClick={handleSearch}
      showTicker
      showFooter={false}
      sidebar={
        <HomeSidebar
          activeTab="all"
          onTabChange={() => router.push("/")}
          onSearchClick={handleSearch}
          walletSlot={<WalletCardLoader />}
        />
      }
    >
      {children}
    </AppShell>
  );
}
